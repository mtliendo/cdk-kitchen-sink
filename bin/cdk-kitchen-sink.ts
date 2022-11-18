#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { AuthStack } from '../lib/AuthStack'
import { FileStorageStack } from '../lib/fileStorageStack'
import { DatabaseStack } from '../lib/DatabaseStack'
import { IdentityStack } from '../lib/IdentityStack'
import { APIStack } from '../lib/APIStack'
import { AmplifyHostingStack } from '../lib/NextjsHostingStack'

const app = new cdk.App()

const authStack = new AuthStack(app, 'ProductAuthStack', {})

const identityStack = new IdentityStack(app, 'ProductIdentityStack', {
	userpool: authStack.userpool,
	userpoolClient: authStack.userPoolClient,
})

const databaseStack = new DatabaseStack(app, 'ProductDatabaseStack', {})

const apiStack = new APIStack(app, 'ProductAppSyncAPIStack', {
	userpool: authStack.userpool,
	sampleTable: databaseStack.productTable,
	unauthenticatedRole: identityStack.unauthenticatedRole,
	identityPool: identityStack.identityPool,
})

const fileStorageStack = new FileStorageStack(app, 'ProductFileStorageStack', {
	authenticatedRole: identityStack.authenticatedRole,
	unauthenticatedRole: identityStack.unauthenticatedRole,
	allowedOrigins: ['http://localhost:3000'],
})

// 🚨 Temporary: Until the construct has support to add "platform",
// run the following CLI command AFTER deploying to use SSRV2:
// aws amplify update-app --app-id THE_APP_ID --platform WEB_COMPUTE
// subsequent nextJS 12+ builds will then work.
const amplifyHostingStack = new AmplifyHostingStack(
	app,
	'ProductHostingStack',
	{
		// Name given to plaintext secret in secretsManager.
		// When creating the token scope on Github, only the admin:repo_hook scope is needed
		githubOauthTokenName: 'github-token',
		owner: 'focusotter',
		repository: 'simple-nextjs',
		//pass in any envVars from the above stacks here
		environmentVariables: {
			USERPOOL_ID: authStack.userpool.userPoolId,
			GRAPHQL_URL: apiStack.graphqlURL,
		},
	}
)
