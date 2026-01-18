// vue.config.js
module.exports = {
  pages: {
    index: {
      entry: 'src/main.js',
      template: 'public/index.html', // ✅ make sure this is specified
      filename: 'index.html',
      title: 'HARKANA CARS Platform',
    },
  },
};