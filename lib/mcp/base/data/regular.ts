/**
 * (c) Copyright Ascensio System SIA 2025
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @license
 */

import * as z from "zod"
import * as moremcp from "../../../../util/moremcp.ts"
import * as regular from "../tools/regular.ts"

export const toolsets: moremcp.Toolset[] = [
	{
		name: "files",
		description: "Operations for working with files.",
		tools: [
			{
				name: "delete_file",
				description: "Delete a file.",
				inputSchema: moremcp.toInputSchema(regular.DeleteFileInputSchema),
			},
			{
				name: "get_file_info",
				description: "Get file information.",
				inputSchema: moremcp.toInputSchema(regular.GetFileInfoInputSchema),
				outputSchema: moremcp.toOutputSchema(regular.GetFileInfoOutputSchema),
			},
			{
				name: "update_file",
				description: "Update a file.",
				inputSchema: moremcp.toInputSchema(regular.UpdateFileInputSchema),
				outputSchema: moremcp.toOutputSchema(regular.UpdateFileOutputSchema),
			},
			{
				name: "copy_batch_items",
				description: "Copy to a folder.",
				inputSchema: moremcp.toInputSchema(regular.CopyBatchItemsInputSchema),
			},
			{
				name: "move_batch_items",
				description: "Move to a folder.",
				inputSchema: moremcp.toInputSchema(regular.MoveBatchItemsInputSchema),
			},
			{
				name: "download_file_as_text",
				description: "Download a file as text.",
				inputSchema: moremcp.toInputSchema(regular.DownloadFileAsTextInputSchema),
			},
			{
				name: "upload_file",
				description: "Upload a file.",
				inputSchema: moremcp.toInputSchema(regular.UploadFileInputSchema),
			},
		],
	},
	{
		name: "folders",
		description: "Operations for working with folders.",
		tools: [
			{
				name: "create_folder",
				description: "Create a folder.",
				inputSchema: moremcp.toInputSchema(regular.CreateFolderInputSchema),
				outputSchema: moremcp.toOutputSchema(regular.CreateFolderOutputSchema),
			},
			{
				name: "delete_folder",
				description: "Delete a folder.",
				inputSchema: moremcp.toInputSchema(regular.DeleteFolderInputSchema),
			},
			{
				name: "get_folder_content",
				description: "Get content of a folder.",
				inputSchema: moremcp.toInputSchema(regular.GetFolderContentInputSchema),
				outputSchema: moremcp.toOutputSchema(regular.GetFolderContentOutputSchema),
			},
			{
				name: "get_folder_info",
				description: "Get folder information.",
				inputSchema: moremcp.toInputSchema(regular.GetFolderInfoInputSchema),
				outputSchema: moremcp.toOutputSchema(regular.GetFolderInfoOutputSchema),
			},
			{
				name: "rename_folder",
				description: "Rename a folder.",
				inputSchema: moremcp.toInputSchema(regular.RenameFolderInputSchema),
				outputSchema: moremcp.toOutputSchema(regular.RenameFolderOutputSchema),
			},
			{
				name: "get_my_folder",
				description: "Get the 'My Documents' folder.",
				inputSchema: moremcp.toInputSchema(regular.GetMyFolderInputSchema),
				outputSchema: moremcp.toOutputSchema(regular.GetMyFolderOutputSchema),
			},
		],
	},
	{
		name: "rooms",
		description: "Operations for working with rooms.",
		tools: [
			{
				name: "create_room",
				description: "Create a room.",
				inputSchema: moremcp.toInputSchema(regular.CreateRoomInputSchema),
				outputSchema: moremcp.toOutputSchema(regular.CreateRoomOutputSchema),
			},
			{
				name: "get_room_info",
				description: "Get room information.",
				inputSchema: moremcp.toInputSchema(regular.GetRoomInfoInputSchema),
				outputSchema: moremcp.toOutputSchema(regular.GetRoomInfoOutputSchema),
			},
			{
				name: "update_room",
				description: "Update a room.",
				inputSchema: moremcp.toInputSchema(regular.UpdateRoomInputSchema),
				outputSchema: moremcp.toOutputSchema(regular.UpdateRoomOutputSchema),
			},
			{
				name: "archive_room",
				description: "Archive a room.",
				inputSchema: moremcp.toInputSchema(regular.ArchiveRoomInputSchema),
			},
			{
				name: "set_room_security",
				description: "Invite or remove users from a room.",
				inputSchema: moremcp.toInputSchema(regular.SetRoomSecurityInputSchema),
				outputSchema: moremcp.toOutputSchema(regular.SetRoomSecurityOutputSchema),
			},
			{
				name: "get_room_security_info",
				description: "Get a list of users with their access levels to a room.",
				inputSchema: moremcp.toInputSchema(regular.GetRoomSecurityInfoInputSchema),
				outputSchema: moremcp.toOutputSchema(regular.GetRoomSecurityInfoOutputSchema),
			},
			{
				name: "get_rooms_folder",
				description: "Get the 'Rooms' folder.",
				inputSchema: moremcp.toInputSchema(regular.GetRoomsFolderInputSchema),
				outputSchema: moremcp.toOutputSchema(regular.GetRoomsFolderOutputSchema),
			},
			{
				name: "get_room_types",
				description: "Get a list of available room types.",
				inputSchema: moremcp.toInputSchema(z.object({})),
			},
			{
				name: "get_room_access_levels",
				description: "Get a list of available room invitation access levels.",
				inputSchema: moremcp.toInputSchema(regular.GetRoomAccessLevelsSchema),
			},
		],
	},
	{
		name: "people",
		description: "Operations for working with users.",
		tools: [
			{
				name: "get_all_people",
				description: "Get all people.",
				inputSchema: moremcp.toInputSchema(regular.GetAllPeopleInputSchema),
				outputSchema: moremcp.toOutputSchema(regular.GetAllPeopleOutputSchema),
			},
		],
	},
]
