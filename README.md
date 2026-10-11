# Universal Visual Creation Platform

This is a scene editor that runs on your own computer and opens in a browser.

## Try the editor

The steps below are the whole setup. Use Node.js 24.21.0. The editor opens without an AI provider. The address you open works on this computer.

A terminal is the window where you type the commands. On Windows, use PowerShell. On Linux, use the Terminal application. Type one command, press Enter, and wait until it finishes before you type the next one.

### 1. Download the project

Follow the Windows steps or the Linux steps. The project folder is the one that contains `package.json`.

On Windows, open this address in the browser:

<https://github.com/ericrommel/universal-editor/archive/refs/heads/master.zip>

The downloaded file is `universal-editor-master.zip`. In File Explorer, right-click it and choose Extract All, then choose Extract. Open the new folder. When `package.json` is not in that folder, open the inner folder named `universal-editor-master`.

Click the address bar of the project folder, type `powershell`, and press Enter. Run:

```text
dir package.json
```

The result includes `package.json`.

On Linux, open Terminal and run:

```text
cd "$HOME"
curl -L -o universal-editor-master.tar.gz https://github.com/ericrommel/universal-editor/archive/refs/heads/master.tar.gz
tar -xzf universal-editor-master.tar.gz
cd universal-editor-master
ls package.json
```

The last command prints `package.json`. When the terminal cannot find `curl`, install it and run the block again. Ubuntu and Debian use `sudo apt install curl`. Fedora uses `sudo dnf install curl`.

When Git is already installed, this is another way to get the same project. The folder name is `universal-editor`.

```text
git clone https://github.com/ericrommel/universal-editor.git
cd universal-editor
```

### 2. Install Node.js 24.21.0

In the project folder, run:

```text
node -v
```

`v24.21.0` means Node.js is ready. Go to section 3. When the terminal cannot find `node`, or the number is different, install 24.21.0 below. The download button on <https://nodejs.org> can be a different version. These installers are for a 64-bit computer.

#### Windows

In PowerShell, run:

```text
$env:PROCESSOR_ARCHITECTURE
```

`AMD64` uses <https://nodejs.org/dist/v24.21.0/node-v24.21.0-x64.msi>.

`ARM64` uses <https://nodejs.org/dist/v24.21.0/node-v24.21.0-arm64.msi>.

Run the downloaded installer and keep the choices it offers. Those choices put `node` on the command path. Approve the Windows prompt when it asks to allow the installer. `x86` is a 32-bit Windows, and these installers do not support it.

Open the project folder again. Click its address bar, type `powershell`, and press Enter.

#### Linux

The Node.js package offered by `apt` or `dnf` is a different version. Install the official 24.21.0 archive into your home folder. That install does not ask for an administrator password.

Run:

```text
uname -m
```

`x86_64` uses the commands below. `aarch64` uses the same commands with `linux-x64` changed to `linux-arm64` in both the file name and the address. Any other result is a machine these archives do not support.

```text
mkdir -p "$HOME/.local/node"
curl -fsSL -o /tmp/node-v24.21.0-linux-x64.tar.gz https://nodejs.org/dist/v24.21.0/node-v24.21.0-linux-x64.tar.gz
tar -xzf /tmp/node-v24.21.0-linux-x64.tar.gz -C "$HOME/.local/node" --strip-components=1
```

The `aarch64` address is <https://nodejs.org/dist/v24.21.0/node-v24.21.0-linux-arm64.tar.gz>.

Add Node.js to the command path. Run the matching pair once.

Bash, including the usual Ubuntu and Fedora terminal:

```text
printf '\nexport PATH="$HOME/.local/node/bin:$PATH"\n' >> "$HOME/.bashrc"
source "$HOME/.bashrc"
```

When `echo "$SHELL"` ends in `zsh`, use this pair instead:

```text
printf '\nexport PATH="$HOME/.local/node/bin:$PATH"\n' >> "$HOME/.zshrc"
source "$HOME/.zshrc"
```

Run `node -v`. It prints `v24.21.0`. Run `corepack --version`. It prints a version. Corepack is included with this Node.js build.

### 3. Start the editor

Stay in the project folder. Corepack comes with Node.js and supplies pnpm 12.8.2, the package tool named by the project. The first command downloads the project libraries. It needs an internet connection and can take a few minutes. When it finishes, the terminal waits for another command.

```text
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

The second command stays running. That running command is the app. It prints:

```text
http://127.0.0.1:5173/
```

Open that address in Microsoft Edge or Google Chrome. The page heading is Universal Visual Creation Platform, and a guide named Start with a shape is on the page. Add a rectangle or a box, then drag it.

Save downloads `scene.json`. This tab keeps the project until you refresh or close the tab. Use Save when you want a file that remains after that.

Leave the terminal open while you use the editor. Closing the terminal, or pressing Ctrl+C in it, stops the page.

### When a command fails

The terminal cannot find `node` or `corepack` after installation. Close the terminal, open the project folder in a new terminal, and run `node -v` again. On Linux, run the `source` command from section 2 in that terminal.

The install command stops because Node.js is not 24.21.0. Install the version in section 2, open a new terminal in the project folder, and run `corepack pnpm install --frozen-lockfile` again.

The start command says port 5173 is already in use. Open <http://127.0.0.1:5173/>. When that page is the editor, use the page that is already running. When it is a different program, close the program using that port and run `corepack pnpm dev` again.

The page says Not ready. The last lines in the terminal name the startup failure.

## For contributors

Product intent is in [docs/product-overview.md](docs/product-overview.md). Engineering process and architecture are under [docs/engineering](docs/engineering). The contributor toolchain is [docs/engineering/developer-setup.md](docs/engineering/developer-setup.md). Module specifications and test plans are under [docs/modules](docs/modules).

`main` is protected. Current product work integrates on `master`. See [docs/engineering/working-line.md](docs/engineering/working-line.md). The scene assistant is [docs/modules/ai-scene-assistant/README.md](docs/modules/ai-scene-assistant/README.md).

Current work status is the GitHub issue and the project board. It is not recorded in this file.
