package com.geracomdev.autoorganizeme

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.paddingFromBaseline
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.geracomdev.autoorganizeme.ui.theme.AutoOrganizeMeTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AutoOrganizeMeTheme {
                Surface(modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background)
                {
                    AutoOrganizeMeWelcome(modifier = Modifier)
                }
            }
        }
    }
}

@Composable
fun AutoOrganizeMeWelcome(modifier: Modifier) {
    Column(modifier.fillMaxSize(), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
        Row {
            Image(painterResource(R.drawable.el_valiente), contentDescription = "Logo")
        }
        Row(modifier.paddingFromBaseline(top = 45.dp)) {
            Text("Auto Organize Me", fontSize = 36.sp, color = MaterialTheme.colorScheme.inversePrimary)
        }
    }
}

@Composable
@Preview
fun AutoOrganizeMeWelcomePreview() {
    AutoOrganizeMeWelcome(modifier = Modifier)
}