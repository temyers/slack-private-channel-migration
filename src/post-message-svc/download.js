/*
  Copyright (c) 2017 Wu Bin
*/

'use strict'

const fs = require('fs')
const https = require('https')
const path = require('path')
const Url = require('url')

const Download = {};

Download.File = (url, dir, filename) => {
    return new Promise((resolve, reject) => {
        if (!dir) {
            throw new Error("Please enter a file path")
        }
        if (typeof filename != "string") {
            filename = path.basename(url)
        }

        var parsedUrl = Url.parse(url)
        var token = process.env.SOURCE_TEAM_TOKEN

        const options = {
            host: parsedUrl.host,
            port: 443,
            path: parsedUrl.path,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        };

        https.get(options, res => {
            let chunk = ""
            res.setEncoding('binary')

            res.on('data', data => {
                    chunk += data;
                })
                .on('error', err => {
                    throw new Error(err)
                })
                .on('end', () => {
                    if (parseInt(res.statusCode) != 200) {
                        throw new Error(`${res.statusCode} ${res.statusMessage}`)
                    }
                    fs.writeFile(dir + filename, chunk, {
                        encoding: 'binary'
                    }, (err) => {
                        if (err) throw new Error(err);
                        resolve({
                            status: res.statusCode,
                            fileLocation: `${dir+filename}`
                        })
                    })
                })
        })
    })
}


module.exports = Download