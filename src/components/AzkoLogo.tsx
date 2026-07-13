import azkoLogo from '../imports/logo-azko_ratio-16x9__1_.jpg'

export function AzkoLogo({ size = 36 }: { size?: number }) {
  return (
    <img
      src={azkoLogo}
      alt="Azko"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        objectPosition: 'center',
        display: 'block',
        flexShrink: 0,
      }}
    />
  )
}
