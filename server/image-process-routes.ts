import type { Express, Request, Response } from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import FormData from "form-data";
import { fileTypeFromBuffer } from "file-type";

// ============================================
// ILOVEIMG IMAGE PROCESSING ROUTES
// ============================================

class ILoveIMGClient {
  private api: any = null;
  private server: string = '';
  private taskId: string = '';
  private token: string = '';
  private width: number = 0;
  private height: number = 0;

  async getTaskId(tool: string): Promise<void> {
    const toolUrls: Record<string, string> = {
      'blurface': 'https://www.iloveimg.com/blur-face',
      'compress': 'https://www.iloveimg.com/compress-image',
      'removebg': 'https://www.iloveimg.com/remove-background',
      'upscale': 'https://www.iloveimg.com/upscale-image',
    };

    const url = toolUrls[tool] || toolUrls['compress'];
    const response = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });

    const html = response.data;
    const tokenMatches = html.match(/(ey[a-zA-Z0-9?%-_/]+)/g);
    if (!tokenMatches || tokenMatches.length < 2) throw new Error('Token not found');
    this.token = tokenMatches[1];

    const configMatch = html.match(/var ilovepdfConfig = ({.*?});/s);
    if (!configMatch) throw new Error('Config not found');
    const config = JSON.parse(configMatch[1]);
    const servers = config.servers;
    if (!Array.isArray(servers) || servers.length === 0) throw new Error('No servers');

    this.server = servers[Math.floor(Math.random() * servers.length)];
    const taskMatch = html.match(/taskId\s*=\s*'(\w+)/);
    if (!taskMatch) throw new Error('TaskId not found');
    this.taskId = taskMatch[1];

    this.api = axios.create({
      baseURL: `https://${this.server}.iloveimg.com`,
      timeout: 60000,
    });
    this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
  }

  async uploadImage(imageBuffer: Buffer, fileName: string): Promise<string> {
    const fileType = await fileTypeFromBuffer(imageBuffer);
    if (!fileType || !fileType.mime.startsWith('image/')) {
      throw new Error('Unsupported image type');
    }

    const form = new FormData();
    form.append('name', fileName);
    form.append('chunk', '0');
    form.append('chunks', '1');
    form.append('task', this.taskId);
    form.append('preview', '1');
    form.append('pdfinfo', '0');
    form.append('pdfforms', '0');
    form.append('pdfresetforms', '0');
    form.append('v', 'web.0');
    form.append('file', imageBuffer, { filename: fileName, contentType: fileType.mime });

    const response = await this.api.post('/v1/upload', form, {
      headers: { ...form.getHeaders(), 'Content-Length': form.getLengthSync() },
    });

    return response.data.server_filename;
  }

  async processImage(tool: string, serverFilename: string, fileName: string): Promise<Buffer> {
    let form = new FormData();
    form.append('task', this.taskId);

    if (tool === 'blurface') {
      form.append('packaged_filename', 'iloveimg-blurred');
      form.append('width', this.width);
      form.append('height', this.height);
      form.append('level', 'recommended');
      form.append('mode', 'include');
      form.append('tool', 'blurfaceimage');
      form.append('files[0][server_filename]', serverFilename);
      form.append('files[0][filename]', fileName);
    } else if (tool === 'compress') {
      form.append('compression_', 'recommended');
      form.append('width', this.width);
      form.append('height', this.height);
      form.append('tool', 'compressimage');
      form.append('packaged_filename', 'iloveimg-compressed');
      form.append('files[0][server_filename]', serverFilename);
      form.append('files[0][filename]', fileName);
    } else if (tool === 'removebg') {
      form.append('server_filename', serverFilename);
      await this.api.post('/v1/removebackground', form, {
        headers: form.getHeaders(),
        responseType: 'arraybuffer',
      });
      return Buffer.from(await this.api.get(`/v1/download/${this.taskId}`, { responseType: 'arraybuffer' }).then(r => r.data));
    } else if (tool === 'upscale') {
      form.append('server_filename', serverFilename);
      form.append('scale', '2');
      await this.api.post('/v1/upscale', form, {
        headers: form.getHeaders(),
        responseType: 'arraybuffer',
      });
      return Buffer.from(await this.api.get(`/v1/download/${this.taskId}`, { responseType: 'arraybuffer' }).then(r => r.data));
    }

    await this.api.post('/v1/process', form, {
      headers: { ...form.getHeaders(), 'Content-Length': form.getLengthSync() },
    });

    const downloadResponse = await this.api.get(`/v1/download/${this.taskId}`, {
      responseType: 'arraybuffer',
    });

    return Buffer.from(downloadResponse.data);
  }

  async processUrl(imageUrl: string, tool: string): Promise<Buffer> {
    await this.getTaskId(tool);

    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 20000,
    });

    const imageBuffer = Buffer.from(imageResponse.data);
    const fileType = await fileTypeFromBuffer(imageBuffer);
    const fileName = `image.${fileType?.ext || 'jpg'}`;

    // Get dimensions for tools that need them
    if (tool === 'blurface' || tool === 'compress') {
      const Jimp = require('jimp');
      const image = await Jimp.read(imageBuffer);
      this.width = image.bitmap.width;
      this.height = image.bitmap.height;
    }

    const serverFilename = await this.uploadImage(imageBuffer, fileName);
    return this.processImage(tool, serverFilename, fileName);
  }
}

const iloveimg = new ILoveIMGClient();

// ============================================
// REGISTER ROUTES
// ============================================
export function registerImageProcessRoutes(app: Express): void {

  // Blur Face
  app.get('/api/v2/image/blurface', async (req: Request, res: Response) => {
    const image = req.query.image as string;
    if (!image) return res.status(400).json({ status: false, error: "Parameter 'image' required" });
    try {
      const buffer = await iloveimg.processUrl(image, 'blurface');
      res.setHeader('Content-Type', 'image/png');
      res.send(buffer);
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // Compress
  app.get('/api/v2/image/compress', async (req: Request, res: Response) => {
    const image = req.query.image as string;
    if (!image) return res.status(400).json({ status: false, error: "Parameter 'image' required" });
    try {
      const buffer = await iloveimg.processUrl(image, 'compress');
      res.setHeader('Content-Type', 'image/jpeg');
      res.send(buffer);
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // Remove Background
  app.get('/api/v2/image/removebg', async (req: Request, res: Response) => {
    const image = req.query.image as string;
    if (!image) return res.status(400).json({ status: false, error: "Parameter 'image' required" });
    try {
      const buffer = await iloveimg.processUrl(image, 'removebg');
      res.setHeader('Content-Type', 'image/png');
      res.send(buffer);
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // Upscale
  app.get('/api/v2/image/upscale', async (req: Request, res: Response) => {
    const image = req.query.image as string;
    if (!image) return res.status(400).json({ status: false, error: "Parameter 'image' required" });
    try {
      const buffer = await iloveimg.processUrl(image, 'upscale');
      res.setHeader('Content-Type', 'image/jpeg');
      res.send(buffer);
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  console.log("✅ Image Process Routes Registered:");
  console.log("  GET /api/v2/image/blurface");
  console.log("  GET /api/v2/image/compress");
  console.log("  GET /api/v2/image/removebg");
  console.log("  GET /api/v2/image/upscale");
}
