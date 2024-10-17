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

    // Convert //text// to *text* for italics
    content = content.replace(/\/\/(.*?)\/\//g, "*$1*");

    return content;
}

// Main function to process the post
function processPost(filename, outputDir = "_posts") {
    const filePath = path.join(__dirname, filename);

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading ${filename}:`, err);
            process.exit(1);
        }

        const lines = data.split("\n");
        if (lines.length < 3) {
            console.error(
                `${filename} must have at least 3 lines: title, tags, and content.`
            );
            process.exit(1);
        }

        const title = lines[0].replace("title:", "").trim();
        const tags = lines[1].replace("tag:", "").trim();
        const content = lines
            .slice(2)
            .join("\n")
            .replace("content:", "")
            .trim();
        const currentDate = new Date().toISOString().split("T")[0];

        const safeTitle = title.toLowerCase().replace(/\s+/g, "-");
        const outputFilename = `${currentDate}-${safeTitle}.md`;

        const tagsFormatted = tags
            ? `tags: [${tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .join(", ")}]\n`
            : "";
        const convertedContent = convertContent(content);

        const jekyllFormatted = `---\nlayout: post\ntitle: "${title}"\ndate: ${currentDate}\n${tagsFormatted}---\n${convertedContent}\n`;

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

// Determine which file to process and place output in _posts
const postFile = process.argv[2] || "post.txt"; // Default to 'post.txt' if no file is provided
processPost(postFile);
