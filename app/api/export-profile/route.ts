import { NextRequest, NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { profile } = data;

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile data is required' },
        { status: 400 }
      );
    }

    // Create HTML content for the profile
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .profile-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 8px;
            }
            .header {
              background: #1a56db;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .profile-image {
              width: 150px;
              height: 150px;
              border-radius: 50%;
              object-fit: cover;
              margin: 20px auto;
              display: block;
              border: 3px solid #1a56db;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin: 20px 0;
            }
            .info-item {
              padding: 10px;
              background: #f3f4f6;
              border-radius: 4px;
            }
            .section {
              margin: 20px 0;
            }
            .section-title {
              color: #1a56db;
              border-bottom: 2px solid #1a56db;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .list {
              list-style-type: none;
              padding: 0;
            }
            .list-item {
              padding: 8px;
              margin: 5px 0;
              background: #f3f4f6;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="profile-container">
            <div class="header">
              <h1>${profile.fullName}</h1>
              <p>${profile.position}</p>
            </div>

            ${profile.profileImage ? 
              `<img src="${profile.profileImage}" alt="Profile" class="profile-image" />` : 
              ''}

            <div class="info-grid">
              <div class="info-item">
                <strong>Date of Birth:</strong> ${profile.dateOfBirth || 'N/A'}
              </div>
              <div class="info-item">
                <strong>Height:</strong> ${profile.height ? `${profile.height} cm` : 'N/A'}
              </div>
              <div class="info-item">
                <strong>Weight:</strong> ${profile.weight ? `${profile.weight} kg` : 'N/A'}
              </div>
              <div class="info-item">
                <strong>Nationality:</strong> ${profile.nationality || 'N/A'}
              </div>
              <div class="info-item">
                <strong>Preferred Foot:</strong> ${profile.preferredFoot || 'N/A'}
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">Description</h2>
              <p>${profile.description || 'No description available.'}</p>
            </div>

            <div class="section">
              <h2 class="section-title">Key Strengths</h2>
              <ul class="list">
                ${profile.strengths?.map((strength: string) => 
                  `<li class="list-item">${strength}</li>`
                ).join('') || 'No strengths listed.'}
              </ul>
            </div>

            <div class="section">
              <h2 class="section-title">Previous Clubs</h2>
              <ul class="list">
                ${profile.clubs?.map((club: { name: string }) => 
                  `<li class="list-item">${club.name}</li>`
                ).join('') || 'No previous clubs listed.'}
              </ul>
            </div>
          </div>
        </body>
      </html>
    `;

    // Configure Puppeteer for Vercel
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();

    // Return PDF file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${profile.fullName.toLowerCase().replace(/\s+/g, '-')}-profile.pdf"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
