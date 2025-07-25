const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');

class DocumentationGenerator {
  constructor() {
    this.docsPath = path.join(__dirname, '../docs');
    this.outputPath = path.join(__dirname, '../docs/generated');
  }

  async generatePDF() {
    try {
      // Ensure output directory exists
      await this.ensureDirectoryExists(this.outputPath);

      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      // Generate individual PDFs
      await this.generateReadmePDF(browser);
      await this.generateTechnicalDocPDF(browser);
      await this.generateAPIPDF(browser);
      await this.generateFlowchartsPDF(browser);

      // Generate combined PDF
      await this.generateCombinedPDF(browser);

      await browser.close();
      console.log('✅ PDF documentation generated successfully!');
    } catch (error) {
      console.error('❌ Error generating PDF documentation:', error);
      throw error;
    }
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async readMarkdownFile(filename) {
    const filePath = path.join(this.docsPath, filename);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return content;
    } catch (error) {
      console.error(`Error reading ${filename}:`, error);
      return '';
    }
  }

  markdownToHTML(markdown) {
    // Simple markdown to HTML conversion
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      
      // Code blocks
      .replace(/```javascript([\s\S]*?)```/g, '<pre><code class="language-javascript">$1</code></pre>')
      .replace(/```json([\s\S]*?)```/g, '<pre><code class="language-json">$1</code></pre>')
      .replace(/```mermaid([\s\S]*?)```/g, '<div class="mermaid">$1</div>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      
      // Bold and italic
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      
      // Line breaks and paragraphs
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    return `<p>${html}</p>`;
  }

  getHTMLTemplate(title, content) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        h2 {
            color: #34495e;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 8px;
            margin-top: 40px;
            margin-bottom: 20px;
            font-size: 1.8em;
        }
        h3 {
            color: #2c3e50;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.3em;
        }
        code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 0.9em;
            color: #e74c3c;
        }
        pre {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 20px 0;
            line-height: 1.4;
        }
        pre code {
            background: none;
            color: inherit;
            padding: 0;
            font-size: 0.9em;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #3498db;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .mermaid {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: #f8f9fa;
        }
        .page-break {
            page-break-before: always;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
        }
        .toc {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .toc ul {
            list-style-type: none;
            padding-left: 0;
        }
        .toc li {
            margin: 10px 0;
            padding: 5px 0;
            border-bottom: 1px dotted #ccc;
        }
        .endpoint {
            background: #e8f5e8;
            border-left: 4px solid #27ae60;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .error-code {
            background: #ffeaa7;
            border-left: 4px solid #fdcb6e;
            padding: 10px;
            margin: 10px 0;
            border-radius: 0 5px 5px 0;
        }
        @page {
            margin: 1in;
            @top-center {
                content: "Arthomed Healthcare Backend Documentation";
                font-size: 10pt;
                color: #666;
            }
            @bottom-center {
                content: counter(page);
                font-size: 10pt;
                color: #666;
            }
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
    <script>
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true
            }
        });
    </script>
</head>
<body>
    <div class="header">
        <h1>Arthomed Healthcare Backend</h1>
        <p>Comprehensive Documentation - ${title}</p>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>
    ${content}
</body>
</html>`;
  }

  async generateReadmePDF(browser) {
    const content = await this.readMarkdownFile('../README.md');
    const html = this.getHTMLTemplate('README', this.markdownToHTML(content));
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: path.join(this.outputPath, 'README.pdf'),
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in'
      }
    });
    
    await page.close();
    console.log('✅ README.pdf generated');
  }

  async generateTechnicalDocPDF(browser) {
    const content = await this.readMarkdownFile('TECHNICAL_DOCUMENTATION.md');
    const html = this.getHTMLTemplate('Technical Documentation', this.markdownToHTML(content));
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Wait for Mermaid diagrams to render
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.pdf({
      path: path.join(this.outputPath, 'TECHNICAL_DOCUMENTATION.pdf'),
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in'
      }
    });
    
    await page.close();
    console.log('✅ TECHNICAL_DOCUMENTATION.pdf generated');
  }

  async generateAPIPDF(browser) {
    const content = await this.readMarkdownFile('API_DOCUMENTATION.md');
    const html = this.getHTMLTemplate('API Documentation', this.markdownToHTML(content));
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: path.join(this.outputPath, 'API_DOCUMENTATION.pdf'),
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in'
      }
    });
    
    await page.close();
    console.log('✅ API_DOCUMENTATION.pdf generated');
  }

  async generateFlowchartsPDF(browser) {
    const content = await this.readMarkdownFile('FLOWCHARTS.md');
    const html = this.getHTMLTemplate('System Flowcharts', this.markdownToHTML(content));
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Wait extra time for Mermaid diagrams to render
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await page.pdf({
      path: path.join(this.outputPath, 'FLOWCHARTS.pdf'),
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in'
      }
    });
    
    await page.close();
    console.log('✅ FLOWCHARTS.pdf generated');
  }

  async generateCombinedPDF(browser) {
    try {
      // Read all markdown files
      const readme = await this.readMarkdownFile('../README.md');
      const technical = await this.readMarkdownFile('TECHNICAL_DOCUMENTATION.md');
      const api = await this.readMarkdownFile('API_DOCUMENTATION.md');
      const flowcharts = await this.readMarkdownFile('FLOWCHARTS.md');

      // Combine all content
      const combinedContent = `
        <div class="toc">
          <h2>Table of Contents</h2>
          <ul>
            <li><a href="#readme">1. Project Overview (README)</a></li>
            <li><a href="#technical">2. Technical Documentation</a></li>
            <li><a href="#api">3. API Documentation</a></li>
            <li><a href="#flowcharts">4. System Flowcharts</a></li>
          </ul>
        </div>
        
        <div id="readme">
          <h1>1. Project Overview</h1>
          ${this.markdownToHTML(readme)}
        </div>
        
        <div class="page-break" id="technical">
          <h1>2. Technical Documentation</h1>
          ${this.markdownToHTML(technical)}
        </div>
        
        <div class="page-break" id="api">
          <h1>3. API Documentation</h1>
          ${this.markdownToHTML(api)}
        </div>
        
        <div class="page-break" id="flowcharts">
          <h1>4. System Flowcharts</h1>
          ${this.markdownToHTML(flowcharts)}
        </div>
      `;

      const html = this.getHTMLTemplate('Complete Documentation', combinedContent);
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Wait for all diagrams to render
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      await page.pdf({
        path: path.join(this.outputPath, 'ARTHOMED_COMPLETE_DOCUMENTATION.pdf'),
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1in',
          right: '1in',
          bottom: '1in',
          left: '1in'
        },
        displayHeaderFooter: true,
        headerTemplate: '<div style="font-size:10px; text-align:center; width:100%; color:#666;">Arthomed Healthcare Backend - Complete Documentation</div>',
        footerTemplate: '<div style="font-size:10px; text-align:center; width:100%; color:#666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
      });
      
      await page.close();
      console.log('✅ ARTHOMED_COMPLETE_DOCUMENTATION.pdf generated');
    } catch (error) {
      console.error('❌ Error generating combined PDF:', error);
      throw error;
    }
  }

  async generateDocumentationIndex() {
    const indexContent = `
# Arthomed Backend Documentation Index

This directory contains comprehensive documentation for the Arthomed Healthcare Backend system.

## Generated Files

### PDF Documentation
- **ARTHOMED_COMPLETE_DOCUMENTATION.pdf** - Complete documentation in a single PDF file
- **README.pdf** - Project overview and setup instructions
- **TECHNICAL_DOCUMENTATION.pdf** - Detailed technical documentation
- **API_DOCUMENTATION.pdf** - Complete API reference
- **FLOWCHARTS.pdf** - System flowcharts and diagrams

### Markdown Documentation
- **README.md** - Project overview (located in root directory)
- **TECHNICAL_DOCUMENTATION.md** - Technical architecture and implementation details
- **API_DOCUMENTATION.md** - Complete API reference with examples
- **FLOWCHARTS.md** - System flowcharts in Mermaid format

## Documentation Sections

### 1. Project Overview (README)
- Project description and features
- Installation and setup instructions
- Environment configuration
- Running the application
- Project structure

### 2. Technical Documentation
- System architecture
- Database design and schemas
- Authentication system
- Performance optimization
- Security implementation
- Error handling
- Deployment architecture

### 3. API Documentation
- Complete API endpoints reference
- Request/response examples
- Authentication requirements
- Error codes and handling
- Usage examples

### 4. System Flowcharts
- Authentication flow
- User registration process
- Appointment booking flow
- File upload system
- Admin management flows
- Error handling workflows

## How to Use This Documentation

1. **For Developers**: Start with the Technical Documentation for architecture overview
2. **For Frontend Developers**: Focus on API Documentation for integration
3. **For System Administrators**: Review Deployment Architecture section
4. **For Project Managers**: Begin with Project Overview and System Flowcharts

## Regenerating Documentation

To regenerate the PDF documentation, run:
\`\`\`bash
node scripts/generatePDF.js
\`\`\`

## Last Updated
${new Date().toLocaleDateString()} - Complete documentation generated

---

**Note**: This documentation is automatically generated from the markdown files. For the most up-to-date information, refer to the source markdown files.
`;

    await fs.writeFile(
      path.join(this.outputPath, 'INDEX.md'),
      indexContent,
      'utf8'
    );
    
    console.log('✅ Documentation index generated');
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting PDF documentation generation...');
  
  const generator = new DocumentationGenerator();
  
  try {
    await generator.generatePDF();
    await generator.generateDocumentationIndex();
    
    console.log('\\n📚 Documentation Generation Complete!');
    console.log('Generated files:');
    console.log('- docs/generated/ARTHOMED_COMPLETE_DOCUMENTATION.pdf');
    console.log('- docs/generated/README.pdf');
    console.log('- docs/generated/TECHNICAL_DOCUMENTATION.pdf');
    console.log('- docs/generated/API_DOCUMENTATION.pdf');
    console.log('- docs/generated/FLOWCHARTS.pdf');
    console.log('- docs/generated/INDEX.md');
    
  } catch (error) {
    console.error('❌ Failed to generate documentation:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DocumentationGenerator;
