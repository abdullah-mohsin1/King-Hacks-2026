#!/usr/bin/env python3
"""
OpenAI-powered lecture summarizer using LangChain
Generates notes, flashcards, quizzes, and podcast scripts from transcripts
"""

import json
import sys
import os
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

# Load .env file if running standalone
if __name__ == "__main__":
    load_dotenv()


class OpenAISummarizer:
    """OpenAI-based summarizer using LangChain"""
    
    def __init__(self, api_key: str, model: str = "gpt-3.5-turbo"):
        """Initialize the OpenAI model via LangChain"""
        self.llm = ChatOpenAI(
            model=model,
            api_key=api_key,
            temperature=0.7,
        )
    
    def format_transcript(self, segments: List[Dict]) -> str:
        """Format transcript segments into readable text with timestamps"""
        lines = []
        for seg in segments:
            start = self._format_time(seg.get('start', 0))
            end = self._format_time(seg.get('end', 0))
            text = seg.get('text', '').strip()
            if text:
                lines.append(f"[{start}-{end}] {text}")
        return '\n'.join(lines)
    
    def _format_time(self, seconds: float) -> str:
        """Convert seconds to MM:SS format"""
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{mins:02d}:{secs:02d}"
    
    def generate_short_notes(self, transcript_text: str, prefs: Optional[Dict] = None) -> str:
        """Generate concise bullet-point notes"""
        prefs = prefs or {}
        focus = prefs.get('focusTopics', [])
        
        prompt = f"""You are an expert note-taker. Summarize the following lecture transcript into concise, bullet-point notes.
Format: Use markdown with clear bullet points. Keep it brief and highlight only the most important points.
{f"Focus on these topics: {', '.join(focus)}" if focus else ""}

Transcript:
{transcript_text}

Generate concise bullet-point notes:"""
        
        response = self.llm.invoke([HumanMessage(content=prompt)])
        return response.content
    
    def generate_detailed_notes(self, transcript_text: str, prefs: Optional[Dict] = None) -> str:
        """Generate comprehensive detailed notes"""
        prefs = prefs or {}
        tone = prefs.get('tone', 'friendly tutor')
        difficulty = prefs.get('difficulty', 'intermediate')
        focus = prefs.get('focusTopics', [])
        
        prompt = f"""You are an expert educator creating detailed study notes from a lecture transcript.
Tone: {tone}
Difficulty level: {difficulty}
{f"Focus on these topics: {', '.join(focus)}" if focus else ""}

Create comprehensive notes that:
1. Break the content into logical sections with headers
2. Include timestamps for reference (format: [MM:SS])
3. Explain concepts clearly at the {difficulty} level
4. Use markdown formatting with headers, bullet points, and emphasis
5. Add summaries for each section

Transcript:
{transcript_text}

Generate detailed lecture notes:"""
        
        response = self.llm.invoke([HumanMessage(content=prompt)])
        return response.content
    
    def generate_flashcards(self, transcript_text: str) -> Dict[str, Any]:
        """Generate flashcards from the transcript"""
        prompt = f"""Create 8-10 flashcards from this lecture transcript. 
Each flashcard should have:
- A clear question or term on the front
- A concise answer or definition on the back
- A timestamp reference from the transcript

Format your response as valid JSON with this structure:
{{
  "flashcards": [
    {{
      "id": 1,
      "front": "Question or term",
      "back": "Answer or definition",
      "timestamp": "[MM:SS-MM:SS]"
    }}
  ],
  "total": 10
}}

Transcript:
{transcript_text}

Generate flashcards in JSON format (respond with ONLY the JSON, no markdown formatting):"""
        
        response = self.llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        
        # Extract JSON from potential markdown code blocks
        if content.startswith('```'):
            # Remove markdown code blocks
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:]
            content = content.strip()
        
        return json.loads(content)
    
    def generate_quiz(self, transcript_text: str) -> Dict[str, Any]:
        """Generate a multiple-choice quiz"""
        prompt = f"""Create a 5-question multiple-choice quiz from this lecture transcript.
Each question should:
- Test understanding of key concepts
- Have 4 options (A, B, C, D)
- Include the correct answer index (0-3)
- Provide an explanation with timestamp reference

Format your response as valid JSON with this structure:
{{
  "questions": [
    {{
      "id": 1,
      "type": "multiple_choice",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Explanation with [MM:SS] reference"
    }}
  ],
  "total": 5
}}

Transcript:
{transcript_text}

Generate quiz in JSON format (respond with ONLY the JSON, no markdown formatting):"""
        
        response = self.llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        
        # Extract JSON from potential markdown code blocks
        if content.startswith('```'):
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:]
            content = content.strip()
        
        return json.loads(content)
    
    def generate_podcast_script(self, transcript_text: str, prefs: Optional[Dict] = None) -> str:
        """Generate a podcast script"""
        prefs = prefs or {}
        tone = prefs.get('tone', 'friendly tutor')
        length_minutes = prefs.get('lengthMinutes', 5)
        focus = prefs.get('focusTopics', [])
        
        prompt = f"""Create a {length_minutes}-minute podcast script that summarizes this lecture.
Tone: {tone}
{f"Focus on: {', '.join(focus)}" if focus else ""}

The script should:
1. Start with an engaging intro
2. Cover the main points in a conversational way
3. Use natural spoken language
4. End with a memorable conclusion
5. Include [INTRO MUSIC], [MAIN CONTENT], [OUTRO MUSIC] markers

Transcript:
{transcript_text}

Generate podcast script:"""
        
        response = self.llm.invoke([HumanMessage(content=prompt)])
        return response.content


def main():
    """CLI entry point for the summarizer"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Usage: python gemini_summarizer.py <command> <input> [options_json]"
        }))
        sys.exit(1)
    
    command = sys.argv[1]
    
    # Get API key from environment
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        print(json.dumps({
            "error": "OPENAI_API_KEY environment variable not set"
        }))
        sys.exit(1)
    
    # Initialize summarizer
    model = os.environ.get('OPENAI_MODEL', 'gpt-3.5-turbo')
    summarizer = GeminiSummarizer(api_key, model)
    
    try:
        if command == "generate":
            if len(sys.argv) < 4:
                print(json.dumps({"error": "Missing input or options"}))
                sys.exit(1)
            
            input_source = sys.argv[2]
            options = json.loads(sys.argv[3])
            
            # Load transcript - either from stdin or file
            if input_source == '-':
                # Read from stdin
                transcript_json = sys.stdin.read()
                transcript = json.loads(transcript_json)
            else:
                # Read from file
                with open(input_source, 'r', encoding='utf-8') as f:
                    transcript = json.load(f)
            
            # Format transcript text
            transcript_text = summarizer.format_transcript(transcript.get('segments', []))
            
            # Generate requested outputs
            result = {}
            prefs = options.get('prefs', {})
            
            if options.get('notesShort'):
                result['notesShort'] = summarizer.generate_short_notes(transcript_text, prefs)
            
            if options.get('notesDetailed'):
                result['notesDetailed'] = summarizer.generate_detailed_notes(transcript_text, prefs)
            
            if options.get('flashcards'):
                result['flashcards'] = summarizer.generate_flashcards(transcript_text)
            
            if options.get('quiz'):
                result['quiz'] = summarizer.generate_quiz(transcript_text)
            
            if options.get('podcastScript'):
                result['podcastScript'] = summarizer.generate_podcast_script(transcript_text, prefs)
            
            # Output result as JSON
            print(json.dumps(result, ensure_ascii=False, indent=2))
        
        else:
            print(json.dumps({"error": f"Unknown command: {command}"}))
            sys.exit(1)
    
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "type": type(e).__name__
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
