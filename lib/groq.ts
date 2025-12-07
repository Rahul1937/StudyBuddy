import Groq from 'groq-sdk'

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

export async function getGroqChatCompletion(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>) {
  const completion = await groq.chat.completions.create({
    messages: messages as any,
    model: 'llama-3.1-8b-instant', // Updated: using available model
    temperature: 0.7,
    max_tokens: 1024,
  })

  return completion.choices[0]?.message?.content || ''
}

