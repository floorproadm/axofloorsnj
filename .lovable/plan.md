
The system already supports video detection during upload, but several UI components need to be updated to correctly render `<video>` tags instead of only `<img>` tags. I will implement a unified media rendering approach across the Company Feed and the public Gallery.

### Proposed Changes

#### 1. Update Media Rendering Components
- **`FeedImageCarousel.tsx`**: Update to check `file_type` and render a `<video>` tag with controls, muted, and playsinline for video assets.
- **`FeedPostCard.tsx`**: Update the thumbnail grid to show a "Play" icon overlay or a video preview when the asset is a video.
- **`FeedPostForm.tsx`**: 
    - Update the image preview grid to handle existing videos.
    - Update the local preview logic for new uploads to distinguish between images and videos (using `file.type.startsWith('video')`).

#### 2. Update Public Gallery
- **`Gallery.tsx`**: 
    - Update the `PublicFeedPost` interface to include `file_type`.
    - Update the Supabase query to fetch `file_type` for feed images.
    - Update the post cards in the gallery to show a video indicator.
    - Update the public lightbox to render videos correctly.

#### 3. Update Shared Post View
- **`SharedPost.tsx`**: Update the image list to render `<video>` tags for assets where `file_type === 'video'`.

### Technical Details
- Videos will be rendered using:
  ```html
  <video 
    src={url} 
    controls 
    className="..." 
    muted 
    playsInline 
    poster={thumbnailUrl} // Optional: we might not have a thumbnail yet, but browser will show first frame
  />
  ```
- For previews and thumbnails where full controls aren't needed, I'll use a simpler video tag or an icon overlay to avoid performance overhead of multiple auto-playing videos.

### Verification Plan
- **Admin Side**:
    1. Go to `/admin/feed/new`.
    2. Upload a video file.
    3. Verify that the preview shows a video or a video icon.
    4. Save the post and verify it renders correctly in the Feed list and Detail view.
- **Public Side**:
    1. Set the post visibility to "public".
    2. Go to the public Gallery page.
    3. Verify the video post appears and plays correctly in the lightbox.
    4. Share the post and verify the shared link renders the video.
