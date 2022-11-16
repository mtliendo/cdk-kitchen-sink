#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { AuthStack } from '../lib/AuthStack'
import { FileStorageStack } from '../lib/fileStorageStack'
import { DatabaseStack } from '../lib/DatabaseStack'
import { IdentityStack } from '../lib/IdentityStack'
import { APIStack } from '../lib/APIStack'

const app = new cdk.App()

const authStack = new AuthStack(app, 'AuthStackSamples', {})

const identityStack = new IdentityStack(app, 'IdentityStackSamples', {
	userpool: authStack.userpool,
	userpoolClient: authStack.userPoolClient,
})

const databaseStack = new DatabaseStack(app, 'DatabaseStackSamples', {})

const apiStack = new APIStack(app, 'AppSyncAPIStackSamples', {
	userpool: authStack.userpool,
	sampleTable: databaseStack.sampleTable,
	unauthenticatedRole: identityStack.unauthenticatedRole,
	identityPool: identityStack.identityPool,
})

const fileStorageStack = new FileStorageStack(app, 'FileStorageStackSamples', {
	authenticatedRole: identityStack.authenticatedRole,
	unauthenticatedRole: identityStack.unauthenticatedRole,
	allowedOrigins: ['http://localhost:3000'],
})
