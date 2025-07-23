# ONLYOFFICE DocSpace MCP Server

<!--generate badges-start-->

[![Open in VS Code using npx command](https://badgen.net/static/Open%20in%20VS%20Code/npx/blue)](https://insiders.vscode.dev/redirect/mcp/install?name=onlyoffice-docspace&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22docspace_base_url%22%2C%22description%22%3A%22The+base+URL+of+the+DocSpace+instance+for+API+requests.%22%7D%2C%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22docspace_api_key%22%2C%22description%22%3A%22The+API+key+for+accessing+the+DocSpace+API.%22%2C%22password%22%3Atrue%7D%5D&config=%7B%22env%22%3A%7B%22DOCSPACE_BASE_URL%22%3A%22%24%7Binput%3Adocspace_base_url%7D%22%2C%22DOCSPACE_API_KEY%22%3A%22%24%7Binput%3Adocspace_api_key%7D%22%7D%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22--yes%22%2C%22%40onlyoffice%2Fdocspace-mcp%22%5D%7D)
[![Open in VS Code Insiders using npx command](https://badgen.net/static/Open%20in%20VS%20Code%20Insiders/npx/cyan)](https://insiders.vscode.dev/redirect/mcp/install?name=onlyoffice-docspace&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22docspace_base_url%22%2C%22description%22%3A%22The+base+URL+of+the+DocSpace+instance+for+API+requests.%22%7D%2C%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22docspace_api_key%22%2C%22description%22%3A%22The+API+key+for+accessing+the+DocSpace+API.%22%2C%22password%22%3Atrue%7D%5D&config=%7B%22env%22%3A%7B%22DOCSPACE_BASE_URL%22%3A%22%24%7Binput%3Adocspace_base_url%7D%22%2C%22DOCSPACE_API_KEY%22%3A%22%24%7Binput%3Adocspace_api_key%7D%22%7D%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22--yes%22%2C%22%40onlyoffice%2Fdocspace-mcp%22%5D%7D&quality=insiders)

<!--generate badges-end-->

[Model Context Protocol] (MCP) is a standardized protocol for managing context between large language models (LLMs) and external systems. This repository provides an MCP server for [ONLYOFFICE DocSpace.]

> [!WARNING]
>
> This ONLYOFFICE DocSpace MCP server is currently in **preview** state. While functional, it may undergo breaking changes, have incomplete features, or contain bugs. Use with caution in production environments and expect potential updates that could affect compatibility.

## Installation

Most clients that implement the MCP protocol have a common configuration file in JSON format, inside which you can add ONLYOFFICE DocSpace MCP server as follows:

```json
{
	"mcpServers": {
		"onlyoffice-docspace": {
			"env": {
				"DOCSPACE_BASE_URL": "https://your-instance.onlyoffice.com",
				"DOCSPACE_API_KEY": "your-api-key"
			},
			"command": "npx",
			"args": ["--yes", "@onlyoffice/docspace-mcp"]
		}
	}
}
```

For a more detailed example of the MCP server installation process, see how it can be done [using Claude Desktop.]

## Configuration

The only way to configure ONLYOFFICE DocSpace MCP server is through environment variables. Below is an example of the `.env` file with possible configuration options:

```ini
#
# Internal configuration options
# These options are intended exclusively for use by company employees when
# integrating the DocSpace MCP server into other company products.
#

# Whether to run the DocSpace MCP server in internal mode.
# @type boolean
# @presence optional
# @default false
DOCSPACE_INTERNAL=

#
# General configuration options
# These options are available for all transport protocols.
#

# The transport protocol to use for communication with the DocSpace MCP server.
# The HTTP transport only available in the internal mode for now.
# @type enumeration
# @enum stdio, http
# @presence optional
# @default stdio
DOCSPACE_TRANSPORT=

# The user agent to include in the User-Agent header for DocSpace API requests
# @type string
# @presence optional
# @default @onlyoffice/docspace-mcp v1.3.1
DOCSPACE_USER_AGENT=

# Whether to enable dynamic tools. See the README.md file for more details about
# how dynamic tools work.
# @type boolean
# @presence optional
# @default false
DOCSPACE_DYNAMIC=

# The list of toolsets to use or 'all' to use all available toolsets. See the
# README.md file for more details about how toolsets work.
# @type enumeration (comma-separated)
# @enum See the README.md file for available toolsets
# @presence optional
# @default all
DOCSPACE_TOOLSETS=

# The list of tools to enable. See the README.md file for more details about how
# enabled tools work.
# @type enumeration (comma-separated)
# @enum See the README.md file for available tools
# @presence optional
# @default none
DOCSPACE_ENABLED_TOOLS=

# The list of tools to disable. See the README.md file for more details about
# how disabled tools work.
# @type enumeration (comma-separated)
# @enum See the README.md file for available tools
# @presence optional
# @default none
DOCSPACE_DISABLED_TOOLS=

#
# stdio configuration options
# These options are available only for the stdio transport protocol.
#

# The base URL of the DocSpace instance for API requests.
# @type url
# @presence required
# @example https://your-instance.onlyoffice.com
DOCSPACE_BASE_URL=

# The origin URL to include in the Origin header for DocSpace API requests.
# @type url
# @presence optional
# @example https://your-instance.onlyoffice.com
DOCSPACE_ORIGIN=

# The API key for accessing the DocSpace API.
# @type
#   string
# @presence
#   Required if nether DOCSPACE_AUTH_TOKEN nor DOCSPACE_USERNAME and
#   DOCSPACE_PASSWORD are provided.
# @example
#   sk-a499e...
DOCSPACE_API_KEY=

# The Personal Access Token (PAT) for accessing the DocSpace API.
# @type
#   string
# @presence
#   Required if neither DOCSPACE_API_KEY nor DOCSPACE_USERNAME and
#   DOCSPACE_PASSWORD are provided.
# @example
#   Fe4Hrgl6...
DOCSPACE_AUTH_TOKEN=

# The username for accessing the DocSpace API using basic authentication.
# @type
#   string
# @presence
#   Required if neither DOCSPACE_API_KEY nor DOCSPACE_AUTH_TOKEN are provided.
#   This configuration is used in conjunction with DOCSPACE_PASSWORD.
# @example
#   henry.milton@onlyoffice.com
DOCSPACE_USERNAME=

# The password for accessing the DocSpace API using basic authentication.
# @type
#   string
# @presence
#   Required if neither DOCSPACE_API_KEY nor DOCSPACE_AUTH_TOKEN are provided.
#   This configuration is used in conjunction with DOCSPACE_USERNAME.
# @example
#   ditgor-p...
DOCSPACE_PASSWORD=

#
# HTTP configuration options
# These options are available only for the http transport protocol.
#

# The host to listen on for incoming HTTP requests.
# @type string
# @presence optional
# @default 127.0.0.1
DOCSPACE_HOST=

# The port to listen on for incoming HTTP requests.
# @type number
# @presence optional
# @default 8080
DOCSPACE_PORT=

# The time-to-live (TTL) for HTTP sessions in milliseconds.
# @type number
# @presence optional
# @default 28800000 (8 hours)
DOCSPACE_SESSION_TTL=

# The interval for checking HTTP sessions for expiration in milliseconds.
# @type number
# @presence optional
# @default 240000 (4 minutes)
DOCSPACE_SESSION_INTERVAL=
```

## Usage

Model Context Protocol describes several different concepts, however ONLYOFFICE DocSpace MCP server implements [Tools] only.

### Tools

> [!NOTE]
>
> In addition to the existing concept of Tools, ONLYOFFICE DocSpace MCP server introduces a new one, Toolsets. A Toolset is a set of related tools.

In ONLYOFFICE DocSpace MCP server, all toolsets and their tools are available by default. However, you can manage this using the following configuration options: `DOCSPACE_TOOLSETS`, `DOCSPACE_ENABLED_TOOLS`, and `DOCSPACE_DISABLED_TOOLS`. See the [Examples](#examples) section for more details on how to configure these options.

Below is a table of available toolsets:

<!--generate toolsets-start-->

| #   | Toolset Name | Toolset Description                  |
| --- | ------------ | ------------------------------------ |
| 1   | `files`      | Operations for working with files.   |
| 2   | `folders`    | Operations for working with folders. |
| 3   | `people`     | Operations for working with users.   |
| 4   | `rooms`      | Operations for working with rooms.   |

<!--generate toolsets-end-->

Below are tables of available tools:

<!--generate tools-start-->

<details>
  <summary><code>files</code></summary>

| #   | Tool Name               | Tool Description         |
| --- | ----------------------- | ------------------------ |
| 1   | `copy_batch_items`      | Copy to a folder.        |
| 2   | `delete_file`           | Delete a file.           |
| 3   | `download_file_as_text` | Download a file as text. |
| 4   | `get_file_info`         | Get file information.    |
| 5   | `move_batch_items`      | Move to a folder.        |
| 6   | `update_file`           | Update a file.           |
| 7   | `upload_file`           | Upload a file.           |

</details>

<details>
  <summary><code>folders</code></summary>

| #   | Tool Name            | Tool Description               |
| --- | -------------------- | ------------------------------ |
| 8   | `create_folder`      | Create a folder.               |
| 9   | `delete_folder`      | Delete a folder.               |
| 10  | `get_folder_content` | Get content of a folder.       |
| 11  | `get_folder_info`    | Get folder information.        |
| 12  | `get_my_folder`      | Get the 'My Documents' folder. |
| 13  | `rename_folder`      | Rename a folder.               |

</details>

<details>
  <summary><code>people</code></summary>

| #   | Tool Name        | Tool Description |
| --- | ---------------- | ---------------- |
| 14  | `get_all_people` | Get all people.  |

</details>

<details>
  <summary><code>rooms</code></summary>

| #   | Tool Name                | Tool Description                                        |
| --- | ------------------------ | ------------------------------------------------------- |
| 15  | `archive_room`           | Archive a room.                                         |
| 16  | `create_room`            | Create a room.                                          |
| 17  | `get_room_access_levels` | Get a list of available room invitation access levels.  |
| 18  | `get_room_info`          | Get room information.                                   |
| 19  | `get_room_security_info` | Get a list of users with their access levels to a room. |
| 20  | `get_room_types`         | Get a list of available room types.                     |
| 21  | `get_rooms_folder`       | Get the 'Rooms' folder.                                 |
| 22  | `set_room_security`      | Invite or remove users from a room.                     |
| 23  | `update_room`            | Update a room.                                          |

</details>

<!--generate tools-end-->

### Meta Tools

In some cases, directly connecting all available tools can be problematic. Using the `DOCSPACE_DYNAMIC` configuration option, you can wrap all available tools into meta-tools. Meta-tools are tools that allow an AI model to interact with other tools dynamically without loading them all simultaneously. Below is a table of available meta-tools:

<!--generate dynamic-start-->

| #   | Meta Tool Name          | Meta Tool Description                                                                                                                                                                           |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `call_tool`             | This is a meta-tool for calling a tool. The list of available tools can be obtained using the list_tools meta-tool. The input schema can be obtained using the get_tool_input_schema meta-tool. |
| 2   | `get_tool_input_schema` | This is a meta-tool for getting an input schema for a specific tool. The list of available tools can be obtained using the list_tools meta-tool.                                                |
| 3   | `list_tools`            | This is a meta-tool for listing available tools of a specific toolset. The list of available toolsets can be obtained using the list_toolsets meta-tool.                                        |
| 4   | `list_toolsets`         | This is a meta-tool for listing available toolsets. Toolset is a set of available tools.                                                                                                        |

<!--generate dynamic-end-->

The `DOCSPACE_DYNAMIC` configuration option is complementary to `DOCSPACE_TOOLSETS`, `DOCSPACE_ENABLED_TOOLS`, and `DOCSPACE_DISABLED_TOOLS` configuration options.

## Examples

In this section you can find examples of how to configure ONLYOFFICE DocSpace MCP server. For simplicity, let us come up with a small list of available toolsets and tools. The real server provides more of them, but for these examples, just a few are enough:

| Toolset   | Tools                                          |
| --------- | ---------------------------------------------- |
| `files`   | `create_file`, `get_file`, `delete_file`       |
| `folders` | `create_folder`, `get_folder`, `delete_folder` |

### Enable a tool from not specified toolset

Configuration:

```ini
DOCSPACE_TOOLSETS=files
DOCSPACE_ENABLED_TOOLS=create_folder
```

Result:

| Toolset   | Tools                                    |
| --------- | ---------------------------------------- |
| `files`   | `create_file`, `get_file`, `delete_file` |
| `folders` | `create_folder`                          |

### Disable a tool from specified toolset

Configuration:

```ini
DOCSPACE_TOOLSETS=files
DOCSPACE_ENABLED_TOOLS=create_folder
DOCSPACE_DISABLED_TOOLS=get_file
```

Result:

| Toolset   | Tools                        |
| --------- | ---------------------------- |
| `files`   | `create_file`, `delete_file` |
| `folders` | `create_folder`              |

### Manually specify tools to be available

Configuration:

```ini
DOCSPACE_TOOLSETS= # Keep this empty to disable all tools
DOCSPACE_ENABLED_TOOLS=create_file,get_file,create_folder
DOCSPACE_DISABLED_TOOLS=get_file,delete_folder
```

Result:

| Toolset   | Tools           |
| --------- | --------------- |
| `files`   | `create_file`   |
| `folders` | `create_folder` |

## License

ONLYOFFICE DocSpace MCP server is distributed under the Apache-2.0 license found in the [LICENSE] file.

<!-- Footnotes -->

[LICENSE]: https://github.com/onlyoffice/docspace-mcp/blob/master/LICENSE/
[Model Context Protocol]: https://modelcontextprotocol.io/
[ONLYOFFICE DocSpace.]: https://www.onlyoffice.com/docspace.aspx
[using Claude Desktop.]: https://modelcontextprotocol.io/quickstart/user/#for-claude-desktop-users
[Tools]: https://modelcontextprotocol.io/docs/concepts/tools/
