import { NextResponse } from 'next/server';
import { Client } from 'ssh2';
import * as fs from 'fs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'image' atau 'video'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate filename
    const ext = file.name.split('.').pop() || 'jpg';
    const safeName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const folder = type === 'video' ? 'videos' : 'products';
    const fileName = `${timestamp}-${random}-${safeName}.${ext}`;

    // Upload ke VPS via SSH/SFTP
    const uploadedPath = await uploadToVPS(buffer, `${folder}/${fileName}`);

    // Return URL dengan domain Cloudflare
    const publicUrl = `https://assets.krearte.id/${folder}/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      path: uploadedPath 
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function uploadToVPS(buffer: Buffer, remotePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = new Client();
    
    const fullRemotePath = `/var/www/krearte-images/${remotePath}`;

    client.on('ready', () => {
      client.sftp((err, sftp) => {
        if (err) {
          client.end();
          return reject(err);
        }

        // Pastikan folder ada
        const dir = remotePath.substring(0, remotePath.lastIndexOf('/'));
        sftp.mkdir(`/var/www/krearte-images/${dir}`, { mode: 0o755 }, () => {
          // Upload file
          sftp.writeFile(
            fullRemotePath,
            buffer,
            { mode: 0o644 },
            (err) => {
              client.end();
              if (err) return reject(err);
              
              // Set permission
              sftp.chmod(fullRemotePath, 0o644, () => {
                resolve(fullRemotePath);
              });
            }
          );
        });
      });
    }).on('error', reject);

    client.connect({
      host: process.env.VPS_HOST || '72.62.120.245',
      port: parseInt(process.env.VPS_PORT || '22'),
      username: process.env.VPS_USER || 'root',
      password: process.env.VPS_PASSWORD, // Atau pakai privateKey
      // privateKey: require('fs').readFileSync(process.env.VPS_PRIVATE_KEY)
    });
  });
}