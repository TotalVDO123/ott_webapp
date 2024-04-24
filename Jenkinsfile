#!/usr/bin/env groovy

def deploy (servers) {
    script {
        for (item in servers) {
            println "Deploying to ${item}."
            sh(script: """
	    whoami
            ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@'${item}' bash -c "'
                ./jwp-cxl.sh
            '"
            """)
        }
    }
}

pipeline {
    agent {
        node {
            label 'docker-node'
        }
    }
 stages {
        stage('Checkout') {
            steps {
                // Checkout your code repository (e.g., Git)
                checkout scm
            }
        }
	 
        stage ('Deploy to dev') {
            when {
                branch 'dev'
            }
            steps {
                script {
                        def servers = ['0.0.0.0']
                        def branch = 'dev'
                        deploy (servers,branch)
                    }
                }
			}
        stage ('Deploy to staging ') {
            when {
                branch 'staging'
            }
            steps {
                script {
                        def servers = ['0.0.0.0']
                        def branch = 'staging'
                        deploy (servers,branch)
                    }
                }
			}
        stage ('Deploy to prod') {
            when {
                branch 'cxl-develop'
            }
            steps {
                script {
                        def servers = ['10.217.125.7']
                        deploy (servers)
                }
            }
		}
	}
    post { 
        always { 
            echo 'I will always run!'
            office365ConnectorSend status: currentBuild.currentResult, webhookUrl: 'https://tuliptechcom.webhook.office.com/webhookb2/03416099-2273-4106-add3-48f502ff8caf@982780f8-0424-4e57-9cc0-bee3d6acc797/IncomingWebhook/93265587596646f988430acf2f978610/b85c9489-d2d0-4cc5-8056-59ecb87bc846'
        }
    }
}
