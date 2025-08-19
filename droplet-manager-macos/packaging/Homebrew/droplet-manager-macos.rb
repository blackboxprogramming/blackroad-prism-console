cask "droplet-manager-macos" do
  version "0.6.0"
  sha256 :no_check

  url "https://github.com/blackroad/droplet-manager-macos/releases/download/v#{version}/DropletManager.zip"
  name "Droplet Manager"
  desc "Manage DigitalOcean droplets from macOS"
  homepage "https://github.com/blackroad/droplet-manager-macos"

  app "DropletManager.app"
  # appcast "https://github.com/blackroad/droplet-manager-macos/releases.atom" # TODO: enable when stable
end
