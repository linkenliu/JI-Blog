const path = require('path');
const qiniuConfig = {
    accessKey: 'ARA9LIvdx3JFZyADmwohmEMyjVLmNSIjVxgpzIA4',
    secretKey: 'aK19LEtOfStwsvn501Pl_h_wTqkVFnbzxlI5FNU7',
    bucket: 'hynal-static',
    cdnHost: 'static.liayal.com',
    originPath: path.resolve(__dirname, '../dist/client/'),
    zone: 'Zone_z0',
}

module.exports = qiniuConfig;