const fs = require('fs/promises');
const path = require('path');
const RSS = require('rss');
const matter = require('gray-matter');

async function generate() {
  const feed = new RSS({
    title: 'sandbox jyb', // Your site title
    site_url: 'https://learning-log.vercel.app', // IMPORTANT: Replace with your actual deployed Vercel URL
    feed_url: 'https://learning-log.vercel.app/feed.xml', // IMPORTANT: Replace with your actual deployed Vercel URL + /feed.xml
    language: 'en',
    description: 'A personal log of learnings, challenges, and future plans in SEO, UX, CRO, and digital marketing.', // Your site description
  });

  const postsDirectory = path.join(process.cwd(), 'pages', 'posts');
  let filesAndFolders;
  try {
    filesAndFolders = await fs.readdir(postsDirectory, { withFileTypes: true });
  } catch (error) {
    console.error(`Error reading posts directory: ${error.message}`);
    filesAndFolders = []; // Handle case where directory might not exist or is empty
  }

  const allPosts = await Promise.all(
    filesAndFolders.map(async (dirent) => {
      // Skip directories (this is the key fix for EISDIR)
      if (dirent.isDirectory()) {
        return null;
      }

      // Only process markdown and mdx files
      if (!dirent.name.endsWith('.md') && !dirent.name.endsWith('.mdx')) {
        return null;
      }

      const filePath = path.join(postsDirectory, dirent.name);
      const source = await fs.readFile(filePath, 'utf8');
      const { data } = matter(source);

      // Only include posts that have a title and date and are not drafts
      if (data.title && data.date && !data.draft) {
        return {
          title: data.title,
          url: `https://learning-log.vercel.app/posts/${dirent.name.replace(/\.mdx?$/, '')}`, // Adjust URL to your live site
          date: new Date(data.date).toISOString(),
          description: data.description || '', // Use post description, or empty string
          // Add other fields if needed, like author, categories
        };
      }
      return null;
    })
  );

  // Filter out any null entries (from skipped directories or invalid posts)
  const validPosts = allPosts.filter(Boolean);

  // Sort posts by date in descending order (newest first)
  validPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

  validPosts.forEach((post) => {
    feed.item(post);
  });

  // Write the RSS feed to feed.xml in the public directory
  await fs.writeFile('./public/feed.xml', feed.xml({ indent: true }));
}

generate();