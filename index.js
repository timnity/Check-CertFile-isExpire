const fs = require('fs')
const path = require('path')

const pem = require('pem')
const dayjs = require('dayjs')
const superagent = require('superagent')

// 读取证书目录
const certDir = './certs' // Your certificate directory
const files = fs.readdirSync(certDir)

files.forEach((file) => {
    if (path.extname(file) === '.pem') {
        // 读取证书文件
        const cert = fs.readFileSync(path.join(certDir, file), 'utf-8')
        // 解析证书
        pem.readCertificateInfo(cert, function (err, certInfo) {
            if (err) {
                console.log(err)
                return
            }

            // 获取证书的有效期
            const validFrom = dayjs(new Date(certInfo.validity.start)).format('YYYY-MM-DD HH:mm:ss')
            const validTo = dayjs(new Date(certInfo.validity.end)).format('YYYY-MM-DD HH:mm:ss')
            console.log(`证书 ${path.basename(file, path.extname(file))} 有效期从 ${validFrom} 到 ${validTo}`)

            // 判断证书有效期与当前时间差多少天
            const diffDays = dayjs(new Date(certInfo.validity.end)).diff(dayjs(), 'day')
            console.log(`证书 ${path.basename(file, path.extname(file))} 有效期剩余 ${diffDays} 天`)

            // 如果证书有效期小于等于 10 天，发送邮件提醒
            if (diffDays <= 10) {
                superagent
                    .post('https://hooks.slack.com/xxxxxx')
                    .send({
                        text: `证书${file}有效期从 ${validFrom} 到 ${validTo}\n有效期剩余 ${diffDays} 天，请注意更新`,
                    })
                    .end(function (err, res) {
                        if (err) {
                            console.log(`POST to Slack channel Error=${err}`)
                            return
                        }
                        console.log(`Slack channel response=${res.text}`)
                    })
            }
            console.log('-----------------------------------\n')
        })
    }
})
