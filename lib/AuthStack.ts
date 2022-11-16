import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import {
	AccountRecovery,
	CfnUserPoolGroup,
	UserPool,
	UserPoolClient,
	VerificationEmailStyle,
} from 'aws-cdk-lib/aws-cognito'
import { Construct } from 'constructs'
import {
	IdentityPool,
	UserPoolAuthenticationProvider,
} from '@aws-cdk/aws-cognito-identitypool-alpha'
import { IRole } from 'aws-cdk-lib/aws-iam'

interface AuthStackProps extends StackProps {}

export class AuthStack extends Stack {
	public readonly identityPoolId: CfnOutput
	public readonly authenticatedRole: IRole
	public readonly unauthenticatedRole: IRole
	public readonly userpool: UserPool

	constructor(scope: Construct, id: string, props: AuthStackProps) {
		super(scope, id, props)

		const userPool = new UserPool(this, `UserpoolSamples`, {
			selfSignUpEnabled: true,
			accountRecovery: AccountRecovery.PHONE_AND_EMAIL,
			userVerification: {
				emailStyle: VerificationEmailStyle.CODE,
			},
			autoVerify: {
				email: true,
			},
			standardAttributes: {
				email: {
					required: true,
					mutable: true,
				},
			},
		})

		const userPoolClient = new UserPoolClient(this, `UserpoolClientSamples`, {
			userPool,
		})

		const identityPool = new IdentityPool(this, `IdentityPoolSamples`, {
			identityPoolName: `IdentityPoolSamples`,
			allowUnauthenticatedIdentities: true,
			authenticationProviders: {
				userPools: [
					new UserPoolAuthenticationProvider({ userPool, userPoolClient }),
				],
			},
		})

		this.authenticatedRole = identityPool.authenticatedRole
		this.unauthenticatedRole = identityPool.unauthenticatedRole
		this.userpool = userPool
		this.identityPoolId = new CfnOutput(this, 'IdentityPoolId', {
			value: identityPool.identityPoolId,
		})

		new CfnOutput(this, 'UserPoolId', {
			value: userPool.userPoolId,
		})

		new CfnOutput(this, 'UserPoolClientId', {
			value: userPoolClient.userPoolClientId,
		})
	}
}
