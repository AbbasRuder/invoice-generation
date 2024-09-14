const express = require("express")
const cors = require("cors")
const puppeteer = require("puppeteer")
const bodyParser = require("body-parser")
const app = express()

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"]
    })
)
// Handle preflight requests
app.options("*", cors())

app.use(bodyParser.json())

const { broAppLogoBase64Encoded } = require("./logo.js")

app.get("/", (req, res) => {
    res.send("Hello World!")
})

app.post("/generate-invoice", async (req, res) => {
    const { invoiceData } = req.body

    const broAppLogo = broAppLogoBase64Encoded

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                .container {
                    max-width: 42rem;
                    margin: 0 auto;
                    border-radius: 0.5rem;
                    padding: 1.5rem;
                }
        
                .header,
                .invoice-details,
                .footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
        
                .header img {
                    height: 3rem;
                    width: 3rem;
                }
        
                .header h1 {
                    font-size: 1.5rem;
                    font-weight: bold;
                }
        
                .header .contact-info {
                    text-align: right;
                }
        
                .header .contact-info p {
                    font-weight: 500;
                    font-size: 0.875rem;
                }
        
                .invoice-details {
                    background-color: rgba(255, 255, 255, 0.1);
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                }
        
                .invoice-details h2 {
                    font-weight: bold;
                    font-size: 1.125rem;
                }
        
                .invoice-details h2 span {
                    font-weight: 600;
                    font-size: 1rem;
                }
        
                .invoice-details p {
                    font-size: 0.875rem;
                }
        
                .invoice-details .text-right {
                    text-align: right;
                }
        
                .invoice-details h3 {
                    font-size: 1.5rem;
                    font-weight: bold;
                }
        
                .table-container {
                    overflow: auto;
                }
        
                table {
                    width: 100%;
                    margin-bottom: 2rem;
                    border-collapse: collapse;
                }
        
                thead {
                    background-color: rgba(255, 255, 255, 0.1);
                }
        
                th,
                td {
                    padding: 0.5rem 1rem;
                    text-align: left;
                    border-bottom: 1px solid #e2e8f0;
                }
        
                th {
                    color: #1a202c;
                }
        
                .summary {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    text-align: right;
                    margin-bottom: 1.5rem;
                }
        
                .summary .totals {
                    border-radius: 0.5rem;
                    width: 50%;
                }
        
                .summary .totals p {
                    display: flex;
                    justify-content: space-between;
                }
        
                .footer {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    margin-bottom: 3rem;
                }
        
                .footer .total {
                    text-align: right;
                }
        
                .footer .total p {
                    font-size: 1.25rem;
                    font-weight: bold;
                }
        
                .footer .total .grand-total {
                    font-size: 1.5rem;
                }
        
                .print-only {
                    text-align: center;
                    font-size: 0.875rem;
                }
            </style>
        </head>
        
        <body>
            <div class="container" id="invoice">
                <div class="header">
                    <div>
                        <img alt="BroApp India Logo" src="${broAppLogo}">
                        <h1>BroApp India</h1>
                    </div>
                    <div class="contact-info">
                        <p>+91 60014 60055</p>
                        <p>broappindia@gmail.com</p>
                    </div>
                </div>
        
                <div class="invoice-details">
                    <div>
                        <h2>To: <span>${invoiceData?.userName}</span></h2>
                        <p>${invoiceData?.address}</p>
                    </div>
                    <div class="text-right">
                        <h3>INVOICE</h3>
                        <p>Date: ${invoiceData?.invoiceDate}</p>
                    </div>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>SR NO.</th>
                                <th>PRODUCT</th>
                                <th>PRICE</th>
                                <th>QUANTITY</th>
                                <th>TAX</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>${invoiceData?.bookedService?.name}</td>
                                <td>₹${invoiceData?.bookedService?.price}</td>
                                <td>${invoiceData?.bookedService?.quantity}</td>
                                <td>₹${invoiceData?.paymentDetails?.taxAmount}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="summary">
                    <div></div>
                   <div class="totals">
                        <p><span>Sub-Total:</span> <span>₹${invoiceData?.paymentDetails?.subTotal}</span></p>
                        ${invoiceData?.paymentDetails?.discountAmount
            ? `<p><span>Discount Amount:</span> <span>₹${invoiceData?.paymentDetails?.discountAmount}</span></p>`
            : ""
        }
                        <p><span>Tax Amount:</span> <span>₹${invoiceData?.paymentDetails?.taxAmount}</span></p>
                        ${invoiceData?.paymentDetails?.fee
            ? `<p><span>Fee:</span> <span>₹${invoiceData?.paymentDetails?.fee}</span></p>`
            : ""
        }
                    </div>
                </div>
                <div class="footer">
                    <div class="total">
                        <p>Grand Total</p>
                        <p class="grand-total">₹${invoiceData?.paymentDetails?.grandTotal}</p>
                    </div>
                </div>
                <p class="print-only">This is a computer-generated document. No signature is required.</p>
            </div>
        </body>
        
        </html>
        `

    await page.setContent(html, { waitUntil: "domcontentloaded" })

    const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
    })

    await browser.close()

    // fs.writeFileSync('invoice-debug.pdf', pdfBuffer);

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="invoice.pdf"',
        "Content-Length": pdfBuffer.length,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST",
    })
    res.end(pdfBuffer)
})

const port = 3001
app.listen(port, () => {
    console.log("Server is running on port " + port)
})

module.exports = app
