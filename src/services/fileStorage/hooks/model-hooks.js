'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const search = require('feathers-mongodb-fuzzy-search');
const permissions = require('../utils/filePermissionHelper');
const FileModel = require('../model').fileModel;

const restrictToCurrentUser = hook => {
	let files = hook.result.data;
	let userId = hook.params.account.userId;
	let allowedFiles = [];
	// permissions check for each file
	return Promise.all(files.map(f => {
		return permissions.checkPermissions(userId, f.key, ['can-write'], false).then(isAllowed => {
			if (isAllowed) {
				f.context = isAllowed.context;
				allowedFiles.push(f);
			}
			return;
		});
	})).then(_ => {
		// get context folder name
		return Promise.all(allowedFiles.map(f => {
			let context = f.context;
			if (!context) {
				f.context = 'geteilte Datei';
			}
			else if (context === 'user') {
				f.context = 'Meine Dateien';
			}
			else {
				f.context = context.name;
			}
			return f;
		})).then(files => {
			hook.result.data = files;
			return hook;
		});
	});
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [search({escape: false})],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};

exports.after = {
	all: [],
	find: [restrictToCurrentUser],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};