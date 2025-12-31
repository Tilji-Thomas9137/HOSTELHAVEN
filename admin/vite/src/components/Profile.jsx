import PropTypes from 'prop-types';
// @mui
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// @types

// @icons
import { IconPhoto } from '@tabler/icons-react';

/***************************  PROFILE  ***************************/

export default function Profile({ avatar, title, caption, label, sx, titleProps, captionProps, placeholderIfEmpty }) {
  // Generate a unique key based on the image src to force re-render when image changes
  // For base64 images, use a hash of the first 50 chars to detect changes
  const getImageKey = (src) => {
    if (!src) return 'no-image';
    if (src.startsWith('data:image/')) {
      // For base64, use a hash of the image data to detect changes
      // Use first 100 chars as a simple hash
      return `base64-${src.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '')}`;
    }
    return src;
  };

  const imageKey = getImageKey(avatar?.src);

  return (
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 0.75, width: 'fit-content', ...sx }}>
      {(avatar?.src || placeholderIfEmpty) && (
        <Avatar
          {...avatar}
          src={avatar?.src}
          alt="profile"
          key={imageKey} // Force re-render when src changes
          sx={{ ...avatar?.sx, ...(placeholderIfEmpty && { fontSize: 20, '& svg': { width: 26, height: 26 } }) }}
        >
          {!avatar?.src && placeholderIfEmpty && <IconPhoto stroke={1} />}
        </Avatar>
      )}
      <Stack sx={{ gap: 0.25 }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
          <Typography variant="subtitle2" {...titleProps} sx={{ color: 'text.primary', whiteSpace: 'nowrap', ...titleProps?.sx }}>
            {title || (placeholderIfEmpty && 'N/A')}
          </Typography>
          {label}
        </Stack>
        <Typography variant="caption" {...captionProps} sx={{ color: 'grey.700', ...captionProps?.sx }}>
          {caption || (placeholderIfEmpty && '---')}
        </Typography>
      </Stack>
    </Stack>
  );
}

Profile.propTypes = {
  avatar: PropTypes.any,
  title: PropTypes.any,
  caption: PropTypes.any,
  label: PropTypes.any,
  sx: PropTypes.any,
  titleProps: PropTypes.any,
  captionProps: PropTypes.any,
  placeholderIfEmpty: PropTypes.any
};
