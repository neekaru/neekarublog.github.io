const fs = require("fs");
const path = require("path");

// Helper function to convert content
function convertContent(content) {
    // Convert ![img url] to <img src="url" alt="image description">
    content = content.replace(
        /!\[(.*?)\]\((.*?)\)/g,
        '<img src="$2" alt="$1" />'
    );

    // Convert (text)[link] to <a href="link">text</a>
    content = content.replace(/\((.*?)\)\[(.*?)\]/g, '<a href="$2">$1</a>');

    // Convert (description)![img url] to <img src="url" alt="description">
    content = content.replace(
        /\((.*?)\)!\[(.*?)\]/g,
        '<img src="$2" alt="$1" />'
    );

    // Convert //text// to *text* for italics, but ignore images and links
    content = content.replace(/\/\/(.*?)\/\//g, "*$1*");

    return content;
}

// Main function to process the post
function processPost(filename, outputDir) {
    const filePath = path.join(__dirname, filename);

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading ${filename}:`, err);
            process.exit(1);
        }

        const lines = data.split("\n");
        if (lines.length < 4) {
            console.error(
                `${filename} must have at least 4 lines: title, author, tags, and content.`
            );
            process.exit(1);
        }

        const title = lines[0].replace("title:", "").trim();
        const author = lines[1].replace("author:", "").trim();
        const tags = lines[2].replace("tag:", "").trim();
        const content = lines
            .slice(3)
            .join("\n")
            .replace("content:", "")
            .trim();
        const currentDate = new Date().toISOString().split("T")[0];

        const safeTitle = title.toLowerCase().replace(/\s+/g, "-");
        const outputFilename = `${author}-${currentDate}-${safeTitle}.md`;

        const tagsFormatted = tags
            ? `tags: [${tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .join(", ")}]\n`
            : "";
        const convertedContent = convertContent(content);

        const jekyllFormatted = `---
layout: post
title: "${title}"
author: "${author}"
date: ${currentDate}
${tagsFormatted}---
${convertedContent}
`;

        const outputPath = path.join(__dirname, outputDir, outputFilename);

        fs.writeFile(outputPath, jekyllFormatted, (err) => {
            if (err) {
                console.error("Error writing markdown file:", err);
                process.exit(1);
            }

            console.log(`Post created: ${outputPath}`);

            // Delete post file after conversion
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Error deleting ${filename}:`, err);
                    process.exit(1);
                }
                console.log(`${filename} deleted successfully.`);
            });
        });
    });
}

// Determine which file to process and where to place the output
const postFile = process.argv[2] || "post.txt"; // Default to 'post.txt' if no file is provided
const outputDir = postFile === "post_blog.txt" ? "_blog" : "_posts"; // Use '_blog' or '_posts'

// Execute the processing function
processPost(postFile, outputDir);
