import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Page, SiteMetadata } from '@/types';

export class CloudflareR2Service {
    private s3Client: S3Client;
    private bucketName: string;

    constructor() {
        this.bucketName = process.env.R2_BUCKET_NAME || '';
        this.s3Client = new S3Client({
            region: 'auto',
            endpoint: process.env.R2_ENDPOINT,
            credentials: {
                accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || '',
            },
        });
    }

    async hostSite(
        pages: Page[], 
        siteId: string, 
        metadata?: Partial<SiteMetadata>
    ): Promise<{ url: string; pages: { [key: string]: string } }> {
        try {
            const baseKey = `${siteId}`;
            const urls: { [key: string]: string } = {};

            // Calculate total HTML size
            const totalHtmlSize = pages.reduce(
                (sum, page) => sum + new Blob([page.html]).size, 
                0
            );

            // Process and upload each page
            for (const page of pages) {
                const pagePath = page.path.startsWith('/') ? 
                    page.path.slice(1) : page.path;
                const key = `${baseKey}/${pagePath}`;
                
                // Process HTML to fix relative links
                let processedHtml = page.html;
                pages.forEach(otherPage => {
                    const relativePath = otherPage.path.startsWith('/') ? 
                        otherPage.path : `/${otherPage.path}`;
   
                });

                const params = {
                    Bucket: this.bucketName,
                    Key: key,
                    Body: processedHtml,
                    ContentType: 'text/html',
                    CacheControl: 'public, max-age=31536000'
                };

                const command = new PutObjectCommand(params);
                await this.s3Client.send(command);

            }

            return {
                url: urls['/index.html'] || Object.values(urls)[0],
                pages: urls
            };
        } catch (error) {
            console.error('Error hosting site to R2:', error);
            throw error;
        }
    }
} 