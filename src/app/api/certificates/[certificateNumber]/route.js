// src/app/api/certificates/[certificateNumber]/route.js
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const supabase = createClient()
    
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('certificate_number', params.certificateNumber)
      .single()

    if (error || !certificate) {
      return new NextResponse('Certificate not found', { status: 404 })
    }

    // Generate simple certificate HTML
    const certificateHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Certificate of Completion</title>
        <style>
          @page { margin: 0; }
          body {
            margin: 0;
            padding: 60px;
            font-family: 'Georgia', serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .certificate {
            background: white;
            padding: 80px 60px;
            max-width: 900px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            border: 20px solid #f8f9fa;
            position: relative;
          }
          .certificate::before {
            content: '';
            position: absolute;
            top: 40px;
            left: 40px;
            right: 40px;
            bottom: 40px;
            border: 2px solid #667eea;
            pointer-events: none;
          }
          .header {
            text-align: center;
            margin-bottom: 50px;
          }
          .title {
            font-size: 48px;
            color: #667eea;
            margin-bottom: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 4px;
          }
          .subtitle {
            font-size: 20px;
            color: #666;
            font-style: italic;
          }
          .content {
            text-align: center;
            margin: 60px 0;
          }
          .awarded-to {
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .recipient-name {
            font-size: 42px;
            color: #333;
            margin-bottom: 30px;
            font-weight: bold;
            border-bottom: 2px solid #667eea;
            display: inline-block;
            padding-bottom: 10px;
          }
          .course-info {
            font-size: 18px;
            color: #666;
            margin-bottom: 20px;
            line-height: 1.8;
          }
          .course-title {
            font-size: 24px;
            color: #667eea;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 80px;
            padding-top: 30px;
            border-top: 2px solid #eee;
          }
          .signature-block {
            text-align: center;
          }
          .signature-line {
            border-top: 2px solid #333;
            width: 250px;
            margin: 0 auto 10px;
            padding-top: 10px;
          }
          .signature-label {
            font-size: 14px;
            color: #666;
          }
          .cert-number {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #999;
            font-family: 'Courier New', monospace;
          }
          .seal {
            position: absolute;
            bottom: 80px;
            right: 80px;
            width: 120px;
            height: 120px;
            border: 4px solid #667eea;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            transform: rotate(-15deg);
          }
          .seal-text {
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            color: #667eea;
            text-transform: uppercase;
            line-height: 1.2;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .certificate {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            <div class="title">Certificate</div>
            <div class="subtitle">of Completion</div>
          </div>
          
          <div class="content">
            <div class="awarded-to">This certificate is proudly presented to</div>
            <div class="recipient-name">${certificate.partner_name}</div>
            
            <div class="course-info">
              For successfully completing the course
            </div>
            <div class="course-title">${certificate.course_title}</div>
            <div class="course-info">
              Completed on ${new Date(certificate.completion_date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          
          <div class="footer">
            <div class="signature-block">
              <div class="signature-line">AmpleLogic</div>
              <div class="signature-label">Authorized Signature</div>
            </div>
            <div class="signature-block">
              <div class="signature-line">${new Date(certificate.issued_at).toLocaleDateString()}</div>
              <div class="signature-label">Date of Issue</div>
            </div>
          </div>
          
          <div class="cert-number">
            Certificate Number: ${certificate.certificate_number}
          </div>
          
          <div class="seal">
            <div class="seal-text">
              AmpleLogic<br/>
              Partner<br/>
              Certified
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return new NextResponse(certificateHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Error generating certificate:', error)
    return new NextResponse('Error generating certificate', { status: 500 })
  }
}