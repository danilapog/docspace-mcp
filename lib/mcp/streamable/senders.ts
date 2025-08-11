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

import type * as express from "express"
import * as format from "../../../util/format.ts"

export function sendRegularError(res: express.Response, code: number, err: Error): void {
	res.status(code)
	res.json({
		message: format.format(err),
	})
}

export function sendJsonrpcError(res: express.Response, httpCode: number, jsonrpcCode: number, err: Error): void {
	res.status(httpCode)
	res.json({
		jsonrpc: "2.0",
		error: {
			code: jsonrpcCode,
			message: format.format(err),
		},
		id: null,
	})
}
