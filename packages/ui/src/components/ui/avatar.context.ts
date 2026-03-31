export const AvatarContext = {
  Avatar: `
  sub-components: AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarBadge
  size?: "default"* | "sm" | "lg"
  children: yes
  ---
  example config: { component: "Avatar", props: { size: "default" }, children: [{ component: "AvatarImage" }] }
  `.trim(),
  AvatarImage: `
  Sub-component of Avatar.
  ---
  example config: { component: "AvatarImage" }
  `.trim(),
  AvatarFallback: `
  Sub-component of Avatar.
  ---
  example config: { component: "AvatarFallback", children: ["AM"] }
  `.trim(),
  AvatarGroup: `
  Sub-component of Avatar.
  ---
  example config: { component: "AvatarGroup", children: ["Content"] }
  `.trim(),
  AvatarGroupCount: `
  Sub-component of Avatar.
  ---
  example config: { component: "AvatarGroupCount", children: ["Content"] }
  `.trim(),
  AvatarBadge: `
  Sub-component of Avatar.
  ---
  example config: { component: "AvatarBadge", children: ["3"] }
  `.trim(),
}

