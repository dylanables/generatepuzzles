const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('.')); // Serve static frontend
app.use(cors());

app.post('/wordsearch', async (req, res) => {

  const prompt_req = req.body.prompt;
  const apiKey = process.env.OPENAI_API_KEY;

  console.log("/generate endpoint called with prompt:", prompt_req);

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    console.log("Sending request to API with prompt:", prompt_req);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
          model: 'gpt-3.5-turbo-1106',
          messages: [
              { role: "system", content: "You are a helpful assistant designed to output words for a wordsearch puzzle in JSON. Create a valid json array containing the words as strings" },
              { role: "user", content: prompt_req },
          ],
          max_tokens: 500,
      }),
    });

    if(!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      return res.status(response.status).json({ error: 'API request failed', details: errorData });
    }

    const data = await response.json();

    console.log("Received response from API:", data);

    res.json(data);
  } catch (err) {
    console.error("Error:",err);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.post('/crossword', async (req, res) => {

  const prompt_req = req.body.prompt;
  const apiKey = process.env.OPENAI_API_KEY;

  console.log("/generate endpoint called with prompt:", prompt_req);

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    console.log("Sending request to API with prompt:", prompt_req);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
          model: 'gpt-3.5-turbo-1106',
          messages: [
              { role: "system", content: "You are a helpful assistant designed to output words and corresponding clues for a crossword puzzle in JSON. Create a valid json array of arrays containing the word and clue as strings, use 'words' as the key name" },
              { role: "user", content: prompt_req },
          ],
          max_tokens: 500,
      }),
    });

    if(!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      return res.status(response.status).json({ error: 'API request failed', details: errorData });
    }

    const data = await response.json();

    console.log("Received response from API:", data);

    res.json(data);
  } catch (err) {
    console.error("Error:",err);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));