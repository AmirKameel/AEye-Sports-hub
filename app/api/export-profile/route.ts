import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: Request) {
  try {
    const { profile, format } = await request.json();

    if (!profile || !format) {
      return NextResponse.json(
        { error: 'Profile data and format are required' },
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
              <h1>${profile.name}</h1>
              <p>${profile.position}${profile.team ? ` - ${profile.team}` : ''}</p>
            </div>

            ${profile.imageUrl ? `<img src="${profile.imageUrl}" alt="Profile" class="profile-image" />` : ''}

            <div class="info-grid">
              <div class="info-item">
                <strong>Age:</strong> ${profile.age || 'N/A'}
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
                <strong>Jersey Number:</strong> ${profile.jerseyNumber || 'N/A'}
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">Description</h2>
              <p>${profile.description || 'No description available.'}</p>
            </div>

            <div class="section">
              <h2 class="section-title">Strengths</h2>
              <ul class="list">
                ${profile.strengths.map((strength: string) => `
                  <li class="list-item">${strength}</li>
                `).join('')}
              </ul>
            </div>

            <div class="section">
              <h2 class="section-title">Areas for Improvement</h2>
              <ul class="list">
                ${profile.weaknesses.map((weakness: string) => `
                  <li class="list-item">${weakness}</li>
                `).join('')}
              </ul>
            </div>
          </div>
        </body>
      </html>
    `;

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
    });
    const page = await browser.newPage();

    // Set content and wait for images to load
    await page.setContent(html);
    await page.waitForSelector('img');

    let buffer;
    if (format === 'png') {
      // Generate PNG
      buffer = await page.screenshot({
        type: 'png',
        fullPage: true,
      });
    } else {
      // Generate PDF
      buffer = await page.pdf({
        format: 'A4',
        printBackground: true,
      });
    }

    await browser.close();

    // Return the file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': format === 'png' ? 'image/png' : 'application/pdf',
        'Content-Disposition': `attachment; filename="${profile.name.toLowerCase().replace(/\s+/g, '-')}-profile.${format}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting profile:', error);
    return NextResponse.json(
      { error: 'Failed to export profile' },
      { status: 500 }
    );
  }
} 