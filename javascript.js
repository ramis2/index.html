let users = [
  {
    id: 1,
    username: 'demo',
    email: 'demo@example.com',
    passwordHash: '$2a$10$N9qo8uL0ickgx2ZMRZoMy.HrYI7qJ6c6XmHh8YIBp6z7QG5b2F1Gq',
    defaultUrl: '/dashboard',  // Add this line
    createdAt: new Date().toISOString()
  }
];
```

2. Update signup endpoint to accept defaultUrl:

```javascript
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password, defaultUrl = '/dashboard' } = req.body;
    
    console.log('Signup attempt:', { username, email, defaultUrl });
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Create new user WITH defaultUrl
    const newUser = {
      id: users.length + 1,
      username,
      email,
      passwordHash,
      defaultUrl,  // Store the custom URL
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    // Create token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return response WITH redirectUrl
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      success: true,
      token,
      user: userWithoutPassword,
      redirectUrl: defaultUrl  // Add this for frontend to use
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
