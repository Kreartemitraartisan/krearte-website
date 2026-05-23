import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const filename = `${timestamp}-${randomStr}-${file.name.replace(/\s/g, '-')}`;
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Save to local temp folder
    const tempPath = join(process.cwd(), 'temp', filename);
    await mkdir(join(process.cwd(), 'temp'), { recursive: true });
    await writeFile(tempPath, buffer);
    
    // Upload ke VPS via SCP
    const vpsHost = process.env.VPS_HOST; // IP VPS
    const vpsUser = process.env.VPS_USER || 'root';
    const vpsPath = `/var/www/krearte-images/${filename}`;
    
    await execPromise(
      `scp -o StrictHostKeyChecking=no "${tempPath}" ${vpsUser}@${vpsHost}:${vpsPath}`
    );
    
    // Cleanup temp file
    await execPromise(`rm "${tempPath}"`);
    
    // Return URL VPS
    const publicUrl = `http://${vpsHost}/${filename}`;
    
    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload to VPS' 
    }, { status: 500 });
  }
}