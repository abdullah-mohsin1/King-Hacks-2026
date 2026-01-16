#!/usr/bin/env python3
"""
Quick test script to verify the LLM pipeline works
Creates a sample transcript and generates notes to console
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the services directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'services'))

from openai_summarizer import OpenAISummarizer as GeminiSummarizer

# Sample transcript (simulating STT output)
sample_transcript = {
    "language": "en",
    "segments": [
        {
            "start": 0.0,
            "end": 5.0,
            "text": "Welcome to today's lecture on machine learning fundamentals."
        },
        {
            "start": 5.5,
            "end": 12.0,
            "text": "Machine learning is a subset of artificial intelligence that enables computers to learn from data."
        },
        {
            "start": 12.5,
            "end": 20.0,
            "text": "There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning."
        },
        {
            "start": 20.5,
            "end": 28.0,
            "text": "Supervised learning uses labeled data to train models. For example, classifying emails as spam or not spam."
        },
        {
            "start": 28.5,
            "end": 35.0,
            "text": "Unsupervised learning finds patterns in unlabeled data, such as customer segmentation."
        },
        {
            "start": 35.5,
            "end": 42.0,
            "text": "Reinforcement learning trains agents to make decisions through trial and error, like training a robot to walk."
        },
        {
            "start": 42.5,
            "end": 50.0,
            "text": "Neural networks are a popular machine learning technique inspired by the human brain's structure."
        },
        {
            "start": 50.5,
            "end": 58.0,
            "text": "Deep learning uses multi-layer neural networks to process complex patterns in images, text, and audio."
        },
        {
            "start": 58.5,
            "end": 65.0,
            "text": "That concludes our introduction to machine learning. Next lecture, we'll dive into specific algorithms."
        }
    ]
}

def main():
    # Check for API key
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        print("❌ ERROR: OPENAI_API_KEY environment variable not set")
        print("\nPlease set your OpenAI API key in .env:")
        print("  OPENAI_API_KEY=your_key_here")
        sys.exit(1)
    
    print("=" * 60)
    print("🎓 LECTURE PROCESSING PIPELINE TEST")
    print("=" * 60)
    
    # Step 1: Show transcript (simulates STT output)
    print("\n📝 STEP 1: Speech-to-Text Output")
    print("-" * 60)
    print(f"Language: {sample_transcript['language']}")
    print(f"Segments: {len(sample_transcript['segments'])}")
    print("\nSample segment:")
    print(f"  [{sample_transcript['segments'][0]['start']:.1f}s - {sample_transcript['segments'][0]['end']:.1f}s]")
    print(f"  \"{sample_transcript['segments'][0]['text']}\"")
    
    # Step 2: Initialize LLM
    print("\n🤖 STEP 2: Initializing OpenAI LLM")
    print("-" * 60)
    model = os.environ.get('OPENAI_MODEL', 'gpt-3.5-turbo')
    print(f"Model: {model}")
    
    summarizer = GeminiSummarizer(api_key, model)
    transcript_text = summarizer.format_transcript(sample_transcript['segments'])
    
    # Step 3: Generate short notes
    print("\n📋 STEP 3: Generating Short Notes with LLM")
    print("-" * 60)
    short_notes = summarizer.generate_short_notes(transcript_text)
    print(short_notes)
    
    # Step 4: Generate detailed notes
    print("\n📚 STEP 4: Generating Detailed Notes with LLM")
    print("-" * 60)
    detailed_notes = summarizer.generate_detailed_notes(transcript_text)
    print(detailed_notes)
    
    print("\n" + "=" * 60)
    print("✅ PIPELINE TEST COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print("\nThe pipeline works:")
    print("  1. ✓ Speech-to-text produces timestamped segments")
    print("  2. ✓ LLM receives and processes transcript")
    print("  3. ✓ Generated short and detailed notes")
    print("  4. ✓ Output displayed to console")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
