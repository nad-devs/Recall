# Recall

**A free, open-source tool for extracting and organizing learning concepts from conversations and notes.**

Recall helps you build a structured knowledge base by automatically extracting key concepts from your learning materials, conversations, and notes. Perfect for students, developers, researchers, and lifelong learners.

## ✨ Features

- 🧠 **AI-Powered Concept Extraction**: Automatically identify and extract key concepts from text
- 🔗 **Relationship Mapping**: Discover connections between different concepts
- 📚 **Smart Categorization**: Organize concepts into meaningful categories
- 💬 **Conversation Analysis**: Extract learning insights from discussions and notes
- 🎯 **Learning Progress**: Track your understanding and mastery of concepts
- 🔍 **Intelligent Search**: Find concepts and relationships quickly
- 📊 **Visual Learning**: See your knowledge graph grow over time

## 🚀 Quick Start

### Local Development (5 minutes)

```bash
# Clone the repository
git clone https://github.com/nad-devs/recall
cd recall

# Install dependencies
npm install

# Set up environment
cp env.example .env
# Add your OpenAI API key to .env

# Start the application
npm run dev
```

Visit `http://localhost:3000` and start building your knowledge base!

### Docker Deployment

```bash
# One-command deployment
OPENAI_API_KEY=your_key docker-compose up -d
```

## 🎯 Why Recall?

### **For Learners**
- **No subscription fatigue**: Self-host for free, pay only for API costs
- **Own your data**: Complete control over your knowledge base
- **Privacy first**: Nothing leaves your server unless you want it to
- **Customizable**: Modify and extend to fit your learning style

### **For Teams**
- **Collaborative learning**: Share knowledge bases with your team
- **Cost effective**: $20-40/month total vs $100+/month per-user tools
- **Enterprise ready**: Deploy on your infrastructure with full control

### **For Developers**
- **Open source**: MIT licensed, contribute and customize freely
- **Modern stack**: Next.js, TypeScript, Prisma, OpenAI
- **Well documented**: Easy to understand and extend
- **Community driven**: Built by learners, for learners

### **For Teams**
- **Collaborative learning**: Share knowledge bases with your team
- **Cost effective**: $20-40/month total vs $100+/month per-user tools
- **Enterprise ready**: Deploy on your infrastructure with full control

## 📊 How It Works

1. **Input**: Paste conversations, notes, or learning materials
2. **Analysis**: AI extracts key concepts and relationships
3. **Organization**: Concepts are categorized and linked automatically
4. **Review**: Confirm, edit, or enhance the extracted concepts
5. **Learn**: Use spaced repetition and relationship mapping to reinforce learning

## 🛠 Technology Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: SQLite (development) / PostgreSQL (production)
- **AI**: OpenAI GPT-4 for concept extraction
- **NLP**: Custom Python service for advanced text processing
- **Deployment**: Docker, supports all major cloud providers

## 📈 Deployment Options

### **Free Hosting**
- **Railway**: 500 hours/month free
- **Render**: 750 hours/month free
- **Fly.io**: 3 VMs free

### **Paid Hosting**
- **DigitalOcean**: $6/month droplet
- **AWS/GCP/Azure**: $10-30/month
- **Self-hosted**: Any VPS or home server

See our [Open Source Deployment Guide](OPEN_SOURCE_DEPLOYMENT.md) for detailed instructions.

## 🤝 Contributing

We welcome contributions! Whether you're:
- 🐛 Reporting bugs
- 💡 Suggesting features
- 🔧 Writing code
- 📝 Improving documentation
- 🎨 Designing UI/UX improvements

Check out our [Contributing Guide](CONTRIBUTING.md) to get started.

## 📋 Roadmap

- [ ] **Local LLM Support**: Run without OpenAI dependency
- [ ] **Mobile App**: iOS and Android applications
- [ ] **Plugin System**: Extend functionality with custom plugins
- [ ] **Advanced Analytics**: Learning progress and knowledge insights
- [ ] **Team Features**: Collaborative knowledge building
- [ ] **Import/Export**: Support for Notion, Obsidian, Roam Research
- [ ] **API**: Programmatic access to your knowledge base

## 💰 Cost Comparison

| Solution | Personal Use | Team (10 users) |
|----------|-------------|------------------|
| **Recall** | $2-10/month | $16-42/month |
| Notion AI | $10/month | $100/month |
| Roam Research | $15/month | $150/month |
| Obsidian Sync | $10/month | $100/month |

*Recall costs include hosting + OpenAI API usage*

## 🔒 Privacy & Security

- **Data ownership**: Your data stays on your server
- **No tracking**: No analytics or telemetry by default
- **Open source**: Audit the code yourself
- **Encryption**: HTTPS/TLS for all communications
- **Backups**: You control your backup strategy

## 📞 Support & Community

- 📖 **Documentation**: Comprehensive guides and tutorials
- 💬 **Discord**: Join our community chat
- 🐛 **GitHub Issues**: Report bugs and request features
- 📧 **Email**: Direct support for deployment help

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with love by the learning community. Special thanks to:
- OpenAI for powerful language models
- The Next.js team for an amazing framework
- All contributors and early adopters

---

**Remember**: This tool exists to help you learn better, not to extract money from you. Use it, modify it, share it. That's the point.

[⭐ Star us on GitHub](https://github.com/nad-devs/recall) | [🚀 Deploy Now](OPEN_SOURCE_DEPLOYMENT.md) | [💬 Join Community](https://discord.gg/recall) 