import Application from '@ioc:Adonis/Core/Application'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import fs from 'fs'
import csvParser from 'csv-parser'
import File from 'App/Models/File'
import path from 'path'
import Database from '@ioc:Adonis/Lucid/Database'
import excelJS from 'exceljs'

export default class FilesController {
  public async fileHandle({ request, response }: HttpContextContract) {
    const file = request.file('file')

    // Move the uploaded file to the tmpPath
    await file.move(Application.tmpPath('file'))

    // Process the file using fs.createReadStream and csv-parser
    const results: any[] = []

    fs.createReadStream(`tmp/file/${file.fileName}`)
      .pipe(csvParser())
      .on('data', (data) => {
        const tempObj = {varient: data.variant,stock: data.stock}
        results.push(tempObj)
      })
      .on('end', async () => {
        try {
          await File.createMany(results)

          console.log('Stocks saved successfully')
          return response.status(200).json({
            status: 'success',
            message: 'Stocks saved successfully',
          })
        } catch (error) {
          console.error('Error saving stocks:', error)
          return response.status(500).json({
            status: 'error',
            message: 'Error saving stocks',
          })
        }
      })
  }

  public async createXLSXFile({ request, response }: HttpContextContract) {
    try {
      // Fetch data from the database using aggregation
      /*
        getting unique data by using _id passing VARIANT
        push to array if there is any duplication
      */
      const stocks = await Database.table('files')
        .select('varient')
        .distinct('varient')
        .select(Database.raw("GROUP_CONCAT(stock SEPARATOR '|') AS stock"))

      const workbook = new excelJS.Workbook() // Create a new workbook
      const worksheet = workbook.addWorksheet("My Stock"); // New Worksheet

      // Column for data in excel. key must match data key
      worksheet.columns = [
        { header: "Variant", key: "variant", width: 20 },
        { header: "Stock", key: "stock", width: 10 },
      ];

      stocks.forEach((stock) => {
        worksheet.addRow({ variant: stock.variant, stock: stock.stock });
      });

      // Making first line in excel bold
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      const uploadFolder = path.join(__dirname, './../uploads');
      const filePath = path.join(uploadFolder, 'stock.xlsx');

      await workbook.xlsx.writeFile(filePath);

      return response.send({
        status: "success",
        message: "file successfully downloaded",
        link: `/stock.xlsx`,
      });
    } catch (error) {
      console.error(error);
      return response
        .status(500)
        .json({ error: 'An error occurred while generating and saving the XLSX file.' });
    }
  }
}
