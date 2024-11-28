import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
  Get,
  Render
} from '@nestjs/common'
import { AppService } from './app.service'
import { VerifyDataDto } from './input-data.dto'

@Controller()
export class AppController {
  constructor (private readonly appService: AppService) {}

  @Post('verify-data')
  async verifyData (@Body() body: VerifyDataDto) {
    const {
      partnerCode,
      categoryID,
      productID,
      productAmount,
      customerID,
      partnerTransID,
      partnerTransDate,
      data,
      otherInfo,
      url
    } = body
    const dataString = `${partnerCode}|${categoryID}|${productID}|${productAmount}|${customerID}|${partnerTransID}|${partnerTransDate}|${data}`
    console.log(dataString)
    const dataSign = await this.appService.createSignature(dataString)
    const dataRequest = {
      partnerCode,
      categoryID,
      productID,
      productAmount,
      customerID,
      partnerTransID,
      partnerTransDate,
      data,
      otherInfo,
      dataSign
    }
    const dataRespon = await this.appService.callPostApi(url, dataRequest)
    if (dataRespon.status) {
      if (!dataRespon.dataSign) {
        throw new HttpException(
          'DataSign cannot be null or undefined',
          HttpStatus.BAD_REQUEST
        )
      }
      const isValid = this.appService.verifySignatureForVTC365(
        dataRespon.responseCode,
        dataRespon.status,
        dataRespon.partnerTransID,
        dataRespon.description,
        dataRespon.dataInfo,
        dataRespon.dataSign
      )
      if (isValid) {
        try {
          return await this.appService.decryptFromBase64(dataRespon.dataInfo)
        } catch (error) {
          throw new HttpException(
            'Error decrypting dataInfo',
            HttpStatus.INTERNAL_SERVER_ERROR
          )
        }
      } else {
        throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED)
      }
    }
  }
}