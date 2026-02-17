const User = require('../models/User');
const Message = require('../models/Message');

const seedUsers = async () => {
    try {
        // Clear existing users to avoid duplicates on restart (though it's in-memory)
        await User.deleteMany();
        await Message.deleteMany();

        const demoUsers = [
            {
                _id: '507f1f77bcf86cd799439011', // Fixed ID for Sarah
                name: 'Sarah Johnson',
                email: 'sarah@techwave.io',
                password: 'password123',
                role: 'Entrepreneur',
                bio: 'Serial entrepreneur with 10+ years of experience in SaaS and fintech.',
                avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg'
            },
            {
                _id: '507f1f77bcf86cd799439012', // Fixed ID for Michael
                name: 'Michael Rodriguez',
                email: 'michael@vcinnovate.com',
                password: 'password123',
                role: 'Investor',
                bio: 'Early-stage investor with focus on B2B SaaS and fintech.',
                avatarUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg'
            }
        ];

        const users = [];
        for (const userData of demoUsers) {
            const user = await User.create(userData);
            users.push(user);
        }

        // Seed initial message
        if (users.length >= 2) {
            await Message.create({
                sender: users[0]._id,
                receiver: users[1]._id,
                content: "Hello Michael, I'd love to chat more about our AI platform."
            });
            await Message.create({
                sender: users[1]._id,
                receiver: users[0]._id,
                content: "Hi Sarah, I'm interested. Let's schedule a call."
            });
        }

        console.log('Demo users and messages seeded successfully');
    } catch (error) {
        console.error('Error seeding users:', error.message);
    }
};

module.exports = seedUsers;
