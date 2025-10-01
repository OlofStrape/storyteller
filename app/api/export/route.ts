import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { storyId, format, title, content } = await req.json();
    
    if (!storyId || !format || !title || !content) {
      return NextResponse.json({ error: "Alla fält krävs" }, { status: 400 });
    }
    
    // Check if user has premium (for export feature)
    const cookieHeader = (req.headers.get("cookie") || "").toLowerCase();
    const hasPremium = /(?:^|;\s*)premium=1(?:;|$)/.test(cookieHeader);
    
    if (!hasPremium) {
      return NextResponse.json({ error: "Premium krävs för export" }, { status: 402 });
    }
    
    let exportData: string;
    let mimeType: string;
    let filename: string;
    
    switch (format) {
      case "pdf":
        // For now, return HTML that can be printed to PDF
        exportData = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { 
            font-family: 'Georgia', serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            background: white;
            color: #333;
        }
        h1 { 
            color: #2c3e50; 
            border-bottom: 2px solid #3498db; 
            padding-bottom: 10px;
            text-align: center;
        }
        .story-content { 
            white-space: pre-wrap; 
            font-size: 16px;
            margin-top: 20px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
            border-top: 1px solid #ecf0f1;
            padding-top: 20px;
        }
        @media print {
            body { margin: 0; }
            .footer { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="story-content">${content}</div>
    <div class="footer">
        <p>Skapad med Drömlyktan - Personliga godnattsagor</p>
        <p>www.dromlyktan.se</p>
    </div>
</body>
</html>`;
        mimeType = "text/html";
        filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
        break;
        
      case "epub":
        // Simple EPUB structure
        exportData = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="book-id" version="2.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:title>${title}</dc:title>
        <dc:creator>Drömlyktan</dc:creator>
        <dc:language>sv</dc:language>
        <dc:identifier id="book-id">dromlyktan-${storyId}</dc:identifier>
    </metadata>
    <manifest>
        <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    </manifest>
    <spine toc="ncx">
        <itemref idref="chapter1"/>
    </spine>
</package>`;
        mimeType = "application/epub+zip";
        filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.epub`;
        break;
        
      case "txt":
        exportData = `${title}\n\n${content}\n\n---\nSkapad med Drömlyktan - Personliga godnattsagor\nwww.dromlyktan.se`;
        mimeType = "text/plain";
        filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
        break;
        
      default:
        return NextResponse.json({ error: "Ogiltigt format" }, { status: 400 });
    }
    
    return new NextResponse(exportData, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
    
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export misslyckades" }, { status: 500 });
  }
}
