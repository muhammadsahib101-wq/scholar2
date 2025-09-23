const slugify = require("slugify");

function createSlug(request, response, next) {
  if (!request.body || typeof request.body !== "object") {
    return next();
  }
  const { name, schemeTitle, discussionTitle, subject } = request.body;
  const title = name || schemeTitle || discussionTitle || subject;
  if (title) {
    request.body.slug = slugify(title, { lower: true, strict: true });
  }
  next();
}

module.exports = createSlug;
