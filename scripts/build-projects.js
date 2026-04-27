#!/usr/bin/env node
/**
 * Build script - Converts CMS YAML files to JSON for frontend consumption
 * Runs during Netlify build process
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const PROJECTS_DIR = path.join(__dirname, '..', '_projects');
const DATA_DIR = path.join(__dirname, '..', 'assets', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'projects.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function parseMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract YAML front matter
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (!match) {
    console.warn(`No front matter found in ${filePath}`);
    return null;
  }
  
  const frontMatter = yaml.load(match[1]);
  const bodyContent = match[2].trim();
  
  return {
    ...frontMatter,
    content: bodyContent,
    slug: path.basename(filePath, '.md')
  };
}

function buildProjects() {
  console.log('🔧 Building projects data...');
  
  ensureDir(DATA_DIR);
  
  if (!fs.existsSync(PROJECTS_DIR)) {
    console.log('⚠️  No _projects directory found. Creating empty projects list.');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2));
    return;
  }
  
  const files = fs.readdirSync(PROJECTS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();
  
  const projects = files
    .map(file => {
      try {
        return parseMarkdownFile(path.join(PROJECTS_DIR, file));
      } catch (err) {
        console.error(`❌ Error parsing ${file}:`, err.message);
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => (a.order || 99) - (b.order || 99));
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(projects, null, 2));
  
  console.log(`✅ Built ${projects.length} projects to ${OUTPUT_FILE}`);
}

buildProjects();
