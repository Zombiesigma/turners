import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function POST(request: NextRequest) {
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    return NextResponse.json({ error: 'GitHub token not configured.' }, { status: 500 });
  }

  const octokit = new Octokit({
    auth: githubToken,
  });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const owner = 'Zombiesigma';
    const repo = 'guntur-aset';
    const path = `articles/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `feat: Add article image ${file.name}`,
      content: fileBuffer.toString('base64'),
      committer: {
        name: 'Guntur Padilah Portfolio Bot',
        email: 'bot@gunturpadilah.web.id',
      },
      author: {
        name: 'Guntur Padilah',
        email: 'gunturfadilah140@gmail.com',
      },
    });

    if (data.content?.download_url) {
        return NextResponse.json({ imageUrl: data.content.download_url });
    } else {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;
        return NextResponse.json({ imageUrl: rawUrl });
    }

  } catch (error: any) {
    console.error('GitHub Upload Error:', error);
    return NextResponse.json({ error: 'Failed to upload image to GitHub.', details: error.message }, { status: 500 });
  }
}
