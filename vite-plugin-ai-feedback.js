import fs from 'fs';
import path from 'path';

export default function aiFeedbackPlugin() {
  return {
    name: 'vite-plugin-ai-feedback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/save-local-feedback' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const feedback = JSON.parse(body);
              const dataDir = path.resolve(process.cwd(), 'src/data');
              const filePath = path.join(dataDir, 'ai_feedback.json');

              // Ensure directory exists
              if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
              }

              // Read existing data
              let existingData = [];
              if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                existingData = JSON.parse(fileContent || '[]');
              }

              // Add new feedback
              existingData.push({
                ...feedback,
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString()
              });

              // Write back to file
              fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Feedback saved locally' }));
              console.log('✅ AI Feedback saved to src/data/ai_feedback.json');
            } catch (error) {
              console.error('❌ Error saving local feedback:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: error.message }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}
