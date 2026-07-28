// CloudFront Function - viewer-request
// Reference copy for version control. Deploy by pasting into the CloudFront
// Functions console; this file is not built or executed by build.js.
//
// Responsibilities:
// 1. Collapse every duplicate URL (www host, /index.html, missing trailing
//    slash) onto a single canonical https://happytimesdayhome.com/... form
//    with one 301 - fixes GSC "Duplicate, Google chose different canonical".
// 2. Leave /submit-inquiry untouched so it isn't rewritten to
//    /submit-inquiry/index.html (contact-form.js posts to this path).
// 3. Rewrite well-formed directory requests to their index.html object so
//    S3 (via OAC, no static-website-hosting) can resolve them.
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    var host = request.headers.host && request.headers.host.value;
    var qs = buildQueryString(request.querystring);

    // Canonical form of the URI, independent of host.
    // /submit-inquiry is excluded from the trailing-slash rule so it never
    // gets redirected to /submit-inquiry/.
    var canonicalUri = uri;
    if (uri === '/index.html') {
        canonicalUri = '/';
    } else if (uri.endsWith('/index.html')) {
        canonicalUri = uri.substring(0, uri.lastIndexOf('index.html'));
    } else if (uri !== '/submit-inquiry' && !uri.endsWith('/') && !uri.includes('.')) {
        canonicalUri = uri + '/';
    }

    var needsRedirect = (host === 'www.happytimesdayhome.com') || (canonicalUri !== uri);

    if (needsRedirect) {
        return redirect('https://happytimesdayhome.com' + canonicalUri + qs);
    }

    if (uri === '/submit-inquiry') {
        return request;
    }

    // Internal rewrite so S3 resolves the object for well-formed requests.
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    }

    return request;
}

function redirect(location) {
    return {
        statusCode: 301,
        statusDescription: 'Moved Permanently',
        headers: { location: { value: location } }
    };
}

function buildQueryString(querystring) {
    if (!querystring) return '';
    var parts = [];
    for (var key in querystring) {
        var param = querystring[key];
        if (param.multiValue) {
            param.multiValue.forEach(function (item) {
                parts.push(key + '=' + item.value);
            });
        } else if (param.value !== undefined) {
            parts.push(key + (param.value ? '=' + param.value : ''));
        }
    }
    return parts.length ? '?' + parts.join('&') : '';
}
