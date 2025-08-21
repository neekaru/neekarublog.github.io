const fs = require("fs");
const path = require("path");

// Helper function to convert content
function convertContent(content) {
    // Convert (description)![img path] to <img src="path" alt="description">
    // Accept absolute URLs, root paths (/...), and relative paths (including assets/...)
    content = content.replace(/\((.*?)\)!\[([^\]]+)\]/g, function (m, desc, src) {
        src = src.trim();
        // Normalize asset shorthand: assets/... -> /assets/...
        if (!/^(?:https?:\/\/|\/)/i.test(src) && src.startsWith('assets/')) {
            src = '/' + src;
        }
        return '<br><img src="' + src + '" alt="' + desc + '" /><br>';
    });

    // Convert ![img path] to <img src="path" />
    // Accept absolute URLs, root paths (/...), and relative paths (including assets/...)
    content = content.replace(/!\[([^\]]+)\]/g, function (m, src) {
        src = src.trim();
        if (!/^(?:https?:\/\/|\/)/i.test(src) && src.startsWith('assets/')) {
            src = '/' + src;
        }
        return '<br><img src="' + src + '" /><br>';
    });

    // Convert (text)[link] to <a href="link">text</a>
    content = content.replace(/\((.*?)\)\[(.*?)\]/g, '<a href="$2">$1</a>');

    // Convert //text// to *text* for italics
    content = content.replace(/\/\/(.*?)\/\//g, "*$1*");

    // Convert ##text## to **text** for bold
    content = content.replace(/##(.*?)##/g, "**$1**");

    // convert ../text\.. for quote
    content = content.replace(/\.\.\/(.*?)\\.\./, '\n> $1')

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

        // Extract title, tags, and optionally cover image from the lines
        const title = lines[0].replace("title:", "").trim();
        const tags = lines[1].replace("tag:", "").trim();

        // Support optional cover image if provided in the second line or elsewhere
        let coverImage = "";
        if (lines[2].startsWith("cover_image:")) {
            coverImage = lines[2].replace("cover_image:", "").trim();
            lines.splice(2, 1); // Remove the cover image line from the array
        }

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

        const coverImageFormatted = coverImage
            ? `cover_image: "${coverImage}"\n`
            : "";

        const convertedContent = convertContent(content);

        const jekyllFormatted = `---\nlayout: post\ntitle: "${title}"\ndate: ${currentDate}\n${tagsFormatted}${coverImageFormatted}---\n${convertedContent}\n`;

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
