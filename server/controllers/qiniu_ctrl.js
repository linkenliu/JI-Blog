import QiNiu from 'qiniu';
import Busboy from 'busboy';
import Config from '../config';
import Util from 'util';
import md5 from "md5";
import { addPhoto } from './photo_ctrl';

const { ACCESS_KEY, SECRET_KEY } = Config.upload;
const DEFAULT_BUCKET = (process.env.NODE_ENV == "production") ? 'hynal-com' : 'hynal-com-test';
const IMG_URL =  (process.env.NODE_ENV == "production") ? "//cdn.liayal.com/" : "//p1hx4ytu8.bkt.clouddn.com/";

function getToken(bucket) {
    let _bucket = bucket || DEFAULT_BUCKET;

    const options = {
        scope: _bucket,
        expires: 120 * 60, // 秒
        returnBody: '{"key": "$(key)", "hash": "$(etag)", "w": "$(imageInfo.width)", "h": "$(imageInfo.height)"}'
    };

    const mac = new QiNiu.auth.digest.Mac(ACCESS_KEY, SECRET_KEY);
    const putPolicy = new QiNiu.rs.PutPolicy(options);
    const uploadToken = putPolicy.uploadToken(mac);

    // return {
    //     token: uploadToken,
    //     expires: + new Date() + 120 * 60 * 1000
    // }

    return uploadToken;
}

export async function uploadToQiniu(ctx, params = {}) {
    let req = ctx.req,
        res = ctx.res;

    let busboy = new Busboy({ headers: req.headers }),
        buf = Buffer.alloc(0);

    let nowTime = +new Date();

    let config = new QiNiu.conf.Config();
    // 空间对应的机房
    config.zone = QiNiu.zone.Zone_z0;
    config.useCdnDomain = true;

    const formUploader = new QiNiu.form_up.FormUploader(config);
    const putExtra = new QiNiu.form_up.PutExtra();

    return new Promise((resolve, reject) => {
        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
            // console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);

            file.on('data', function(data) {
                // console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
                buf = Buffer.concat([buf, data]);
            });

            file.on('end', function() {
                // console.log('File [' + fieldname + '] Finished');
                let time = +new Date();
                let key = params.prefix ? `${params.prefix}${md5(time )}` : md5(time);
                // 获取上传token
                let UPLOAD_TOKEN = getToken(params.bucket || null);

                formUploader.put(UPLOAD_TOKEN, key, buf, putExtra, function(respErr,
                    respBody, respInfo) {
                    if (respErr) {
                        // throw respErr;
                        resolve({
                            code: 500,
                            ...respErr
                        })
                    }
                    if (respInfo.statusCode == 200) {
                        // console.log('respBody200', respBody);
                        resolve({
                            code: 200,
                            data: {
                                filename,
                                ...respBody
                            }
                        })
                    } else {
                        // console.log('respInfo', respInfo.statusCode);
                        // console.log('respBody', respBody);
                        resolve({
                            code: respInfo.statusCode,
                            ...respBody
                        })
                    }
                });
            });

        });

        busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
            // console.log('Field [' + fieldname + ']: value: ' + Util.inspect(val));
            params[fieldname] = val;
        });

        req.pipe(busboy);

    })
}

export async function fileUpload(ctx) {
    let result = await uploadToQiniu(ctx);

    ctx.body = result;
}

export async function getPhotoes(ctx) {
    let params = ctx.query;

    const bucket = params.bucket || 'hynal-com';

    let defaultOpts = {
        limit: 10,
        prefix: 'photo/',
    };

    const options = Object.assign(defaultOpts, params);
    const mac = new QiNiu.auth.digest.Mac(ACCESS_KEY, SECRET_KEY);
    const config = new QiNiu.conf.Config();
    //config.useHttpsDomain = true;
    config.zone = QiNiu.zone.Zone_z0;
    const bucketManager = new QiNiu.rs.BucketManager(mac, config);

    let result = await new Promise((resolve, reject) => {
        bucketManager.listPrefix(bucket, options, function(err, respBody, respInfo) {
            if (err) {
                console.log(err);
                ctx.throw(500, err);
            }
            if (respInfo.statusCode == 200) {
                //如果这个nextMarker不为空，那么还有未列举完毕的文件列表，下次调用listPrefix的时候，
                //指定options里面的marker为这个值
                let nextMarker = respBody.marker;
                let commonPrefixes = respBody.commonPrefixes;
                resolve({
                    code: 200,
                    data: respBody
                })
            } else {
                resolve({
                    code: 400,
                    data: respBody
                })
            }
        });
    });

    ctx.body = result;

}

export async function articleImageUpload(ctx) {
    let result = await uploadToQiniu(ctx, { prefix: 'image/' });


    ctx.body = {
        success: result.code == 200 ? 1 : 0,
        message: result.code == 200 ? '上传成功' : "上传失败",
        url: result.code == 200 ? `${IMG_URL}${result.data.key}` : ''
    }
}

export async function deleteFileInQiniu(key, bucket) {
    let _bucket = bucket || DEFAULT_BUCKET;
    const mac = new QiNiu.auth.digest.Mac(ACCESS_KEY, SECRET_KEY);
    const config = new QiNiu.conf.Config();
    //config.useHttpsDomain = true;
    config.zone = QiNiu.zone.Zone_z0;
    const bucketManager = new QiNiu.rs.BucketManager(mac, config);
    return new Promise((resolve, reject) => {
        bucketManager.delete(_bucket, key, function(err, respBody, respInfo) {
            if (err) {
                reject(err);
            } else {
                resolve(respInfo)
            }
        });
    })
}

export async function deleteFile(ctx) {
    let postData = ctx.request.body;

    let result = await deleteFileInQiniu(postData.key, postData.bucket);

    ctx.body = result;
}