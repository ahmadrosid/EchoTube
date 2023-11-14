# EchoTube

[OpenAPI spec](https://echo-tube.vercel.app/swagger.json)

## Example endpoint:

**1. Get video info**:

```bash
curl --request POST \
  --url https://echo-tube.vercel.app/get-video-info \
  --header 'Content-Type: application/json' \
  --data '{
	"videoUrl":"https://www.youtube.com/watch?v=-KO3GIoBT5U"
}'
```

**2. Get channel videos**

```bash
curl --request POST \
  --url https://echo-tube.vercel.app/channel/videos \
  --header 'Content-Type: application/json' \
  --data '{
	"id":"UCe1XaogCcgVssRJ9jV295og"
}'
```

**2. Get video transcript**

```bash
curl --request POST \
  --url https://echo-tube.vercel.app/get-transcript \
  --header 'Content-Type: application/json' \
  --data '{
	"videoUrl":"https://www.youtube.com/watch?v=-KO3GIoBT5U"
}'
```
