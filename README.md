# YouTube Video & Audio Downloader

This Node.js application allows users to download high-quality audio and video from YouTube. It supports downloading only audio or merging audio and video into a single file. The server runs on **port 5000** and provides a simple API for initiating downloads.

## Features

- Download high-quality audio or video from YouTube.
- Merges audio and video files into a single MP4 file.
- Temporary storage for downloaded files, which are automatically deleted after 1 minute.
- Provides metadata for videos, including title, thumbnail, and size.

## Requirements

- Node.js (v14 or higher recommended)
- npm (Node Package Manager)
- FFmpeg (Ensure it is installed and added to your PATH)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/RachidZahrani/YouTube-Video-Downloader.git
   cd <repository_folder>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

4. Open your browser or API client (like Postman) and access the application at:
   ```
   http://localhost:5000
   ```

## Endpoints

### 1. `GET /`

- **Description**: Serves the home page (if implemented with a UI).

### 2. `POST /download`

- **Description**: Downloads audio or video from the provided YouTube URL.
- **Request Body**:
  ```json
  {
    "url": "<YouTube video URL>",
    "format": "audio" | "video"
  }
  ```
- **Response**:
  - On success:
    ```json
    {
      "message": "Download successful",
      "file": "<Download URL>"
    }
    ```
  - On error:
    ```json
    {
      "error": "<Error message>"
    }
    ```

### 3. `POST /search`

- **Description**: Retrieves metadata for a YouTube video.
- **Request Body**:
  ```json
  {
    "url": "<YouTube video URL>"
  }
  ```
- **Response**:
  ```json
  {
    "videoDetails": {
      "title": "<Video title>",
      "thumbnail": "<Thumbnail URL>",
      "size": {
        "video": "<Video size in bytes>",
        "audio": "<Audio size in bytes>"
      },
      "videoId": "<YouTube video ID>"
    }
  }
  ```

## File Storage and Cleanup

- All downloaded files are stored in the `downloads` directory.
- Files are automatically deleted after 1 minute to save storage space.

## Notes

- Ensure **FFmpeg** is installed and correctly configured. The application uses FFmpeg to merge audio and video files.
- The API supports Cross-Origin Resource Sharing (CORS) for easier integration with front-end applications.

## Example Usage

### Download Audio
```bash
curl -X POST http://localhost:5000/download \
-H "Content-Type: application/json" \
-d '{"url": "https://www.youtube.com/watch?v=example", "format": "audio"}'
```

### Fetch Video Metadata
```bash
curl -X POST http://localhost:5000/search \
-H "Content-Type: application/json" \
-d '{"url": "https://www.youtube.com/watch?v=example"}'
```

### Download Video
```bash
curl -X POST http://localhost:5000/download \
-H "Content-Type: application/json" \
-d '{"url": "https://www.youtube.com/watch?v=example", "format": "video"}'
```

## License

This project is open-source and available for use under the MIT License.
 
