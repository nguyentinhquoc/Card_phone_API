import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import * as crypto from 'crypto'
import { firstValueFrom } from 'rxjs'
@Injectable()
export class AppService {
  private readonly publicKey: string = `-----BEGIN PUBLIC KEY-----
MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgKJ562mANfjXEjzBphTWhUf7ludF
zeYpcEhB9UzdmPUnrW5rusfFgYT2syBV3BrHSDiwvyAPFVyJNKGxg8ya0lOtx84T
FGQFuSePEm4CPHNJUNmDWvL2up/NE97hHugH+S1wwUoW+SA8ctIxlu6sojE64htw
s53IfcLvZut7cdNVAgMBAAE=
-----END PUBLIC KEY-----`
  private readonly privateKey: string = `-----BEGIN RSA PRIVATE KEY-----
MIICXwKBAQACgYCieetpgDX41xI8waYU1oVH+5bnRc3mKXBIQfVM3Zj1J61ua7rH
xYGE9rMgVdwax0g4sL8gDxVciTShsYPMmtJTrcfOExRkBbknjxJuAjxzSVDZg1ry
9rqfzRPe4R7oB/ktcMFKFvkgPHLSMZburKIxOuIbcLOdyH3C72bre3HTVQKBAwEA
AQKBgIkbaVT2JJWAqJssrwIWpRJBdO5lMYNwpJfVUTM0LMd0XB46OrwqJ0oVBMPc
sIjIcmGkhSSAlf4oqoloS1h1rdYmt9Fds9F/OBJWx0AgLQ4vZ2SqdAi9RLC6BTHZ
QSX7Ur+u9mycnSvkeaZSTz+f4e+1W1Gx2t7JaJObmRu5JEthAoFAwXbQ+BfYEAxp
7K9QzOZ9AVXuoPzMyG2tZtAsLDAs1tNfXto5/sCDswYsYa8yBCszPNckJMa8fyH9
Ne7kf8PGrwKBQNb+2h84naWRZ3eIvkx+XwXtRWGRf09hux38/JeW7sGkVArpkIGk
Xw59mGNp5PPapXPwDGF05PhMkO9deoxvxzsCgUAxR8jXSYuaGu9ogQf+CcBR9MfC
bmLjszx2chSudN8XIeSrTr9zKyrhEXOAtpXxBegZWVw1mgIuCERt1pqSCRa1AoFA
CHAAB3GlXjYSpXJMZZwgBo+FRYr8QBVJzqd7EkfuHtNgKP15mlzlDiCHtn8VaSyP
iblGAx0fT09R8NLuWEyauQKBQI/6+gnyEwGV3qKTQpRUm60uQJyxG4gTNInyHe22
OfnPX8lWPSNCtYugMoUldWbilJn4xqcQYx6e6/dGY+b9Vwc=
-----END RSA PRIVATE KEY-----`
  constructor (private readonly httpService: HttpService) {}
  //TẠo chứ ký
  createSignature (data: string): string {
    const sign = crypto.createSign('SHA256')
    sign.update(data)
    sign.end()
    const dataSign = sign.sign(this.privateKey, 'base64')
    return dataSign
  }
  //giải mã datat trả về
  verifySignatureForVTC365 (
    responseCode: string,
    status: string,
    partnerTransID: string,
    description: string,
    dataInfo: string,
    dataSign: string
  ): boolean {
    const data = `${responseCode}|${status}|${partnerTransID}|${description}|${dataInfo}`
    if (!dataSign) {
      throw new Error('DataSign cannot be null or undefined')
    }
    const verify = crypto.createVerify('SHA256')
    verify.update(data, 'utf8')
    verify.end()
    return verify.verify(this.publicKey, dataSign, 'base64')
  }
  decryptFromBase64 (dataInfo: string) {
    if (!dataInfo) {
      throw new Error('Data to decrypt cannot be null or undefined')
    }
    if (!dataInfo || typeof dataInfo !== 'string') {
      return 'Invalid Base64 string'
    }
    try {
      const decodedBuffer = Buffer.from(dataInfo, 'base64')
      return decodedBuffer.toString('utf-8')
    } catch (error) {
      return 'Error decoding Base64 string'
    }
  }
  async callPostApi (url, postData): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, postData)
      )
      return response.data
    } catch (error) {
      console.error('Error calling API:', error)
      throw error
    }
  }
}
