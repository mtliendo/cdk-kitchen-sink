import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import { Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'
import * as path from 'path'
import {
	GraphqlApi,
	Schema,
	AuthorizationType,
	FieldLogLevel,
	MappingTemplate,
	PrimaryKey,
	Values,
} from '@aws-cdk/aws-appsync-alpha'
import { UserPool } from 'aws-cdk-lib/aws-cognito'
import { IRole } from 'aws-cdk-lib/aws-iam'

interface APIStackProps extends StackProps {
	userpool: UserPool
	sampleTable: Table
	unauthenticatedRole: IRole
}

export class APIStack extends Stack {
	constructor(scope: Construct, id: string, props: APIStackProps) {
		super(scope, id, props)

		const api = new GraphqlApi(this, 'APISamples', {
			name: 'APISamples',
			schema: Schema.fromAsset(path.join(__dirname, 'graphql/schema.graphql')),
			authorizationConfig: {
				defaultAuthorization: {
					authorizationType: AuthorizationType.USER_POOL,
					userPoolConfig: {
						userPool: props.userpool,
					},
				},
				additionalAuthorizationModes: [
					{ authorizationType: AuthorizationType.IAM },
				],
			},
			logConfig: {
				fieldLogLevel: FieldLogLevel.ALL,
			},
			xrayEnabled: true,
		})

		const TodoDataSource = api.addDynamoDbDataSource(
			'TodoDataSourceSamples',
			props.sampleTable
		)

		api.grantQuery(props.unauthenticatedRole, 'getTodo')

		api.grantQuery(props.unauthenticatedRole, 'listTodos')

		TodoDataSource.createResolver({
			typeName: 'Query',
			fieldName: 'getTodo',
			requestMappingTemplate: MappingTemplate.dynamoDbGetItem('id', 'id'),
			responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
		})

		TodoDataSource.createResolver({
			typeName: 'Mutation',
			fieldName: 'createTodo',
			requestMappingTemplate: MappingTemplate.dynamoDbPutItem(
				PrimaryKey.partition('id').auto(),
				Values.projecting('input')
			),
			responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
		})
		TodoDataSource.createResolver({
			typeName: 'Query',
			fieldName: 'listTodos',
			requestMappingTemplate: MappingTemplate.dynamoDbScanTable(),
			responseMappingTemplate: MappingTemplate.dynamoDbResultList(),
		})

		new CfnOutput(this, 'GraphQLAPIURL', {
			value: api.graphqlUrl,
		})

		new CfnOutput(this, 'GraphQLAPIID', {
			value: api.apiId,
		})
	}
}
